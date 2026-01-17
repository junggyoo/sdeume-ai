import { Hono } from 'hono';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  respond,
  type HandlerResult,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import type { Upload, UploadRole, BucketType } from '@/features/upload/types';

// =============================================================================
// Types
// =============================================================================

interface UploadRow {
  id: string;
  project_id: string;
  user_id: string;
  role: UploadRole;
  original_url: string;
  cropped_url: string | null;
  bucket_type: BucketType | null;
  face_yaw: number | null;
  smile_score: number | null;
  quality_score: number | null;
  is_selected: boolean;
  crop_mode: 'original' | 'face' | 'body';
  crop_rect: { x: number; y: number; width: number; height: number } | null;
  created_at: string;
}

// =============================================================================
// Schemas
// =============================================================================

const UploadImageSchema = z.object({
  projectId: z.string().uuid(),
  role: z.enum(['groom', 'bride']),
  bucketType: z.enum(['A', 'B', 'C', 'D']).optional(),
  faceYaw: z.number().optional(),
  smileScore: z.number().min(0).max(1).optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});

const ProjectIdParamSchema = z.object({
  projectId: z.string().uuid(),
});

const UploadIdParamSchema = z.object({
  uploadId: z.string().uuid(),
});

type UploadImageInput = z.infer<typeof UploadImageSchema>;

// =============================================================================
// Error Codes
// =============================================================================

const uploadErrorCodes = {
  notFound: 'UPLOAD_NOT_FOUND',
  uploadError: 'UPLOAD_ERROR',
  fetchError: 'UPLOAD_FETCH_ERROR',
  invalidProject: 'UPLOAD_INVALID_PROJECT',
  storageError: 'STORAGE_ERROR',
  deleteError: 'UPLOAD_DELETE_ERROR',
} as const;

type UploadServiceError = (typeof uploadErrorCodes)[keyof typeof uploadErrorCodes];

// =============================================================================
// Helpers
// =============================================================================

const mapRowToUpload = (row: UploadRow): Upload => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  role: row.role,
  originalUrl: row.original_url,
  croppedUrl: row.cropped_url,
  bucketType: row.bucket_type,
  faceYaw: row.face_yaw,
  smileScore: row.smile_score,
  qualityScore: row.quality_score,
  isSelected: row.is_selected,
  cropMode: row.crop_mode,
  cropRect: row.crop_rect,
  createdAt: row.created_at,
});

const getAuthUser = async (
  c: { req: { header: (name: string) => string | undefined } },
  supabase: SupabaseClient
) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return { user: null, error: 'Authorization header required' };
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Invalid token' };
  }

  return { user, error: null };
};

// =============================================================================
// Service Functions
// =============================================================================

const uploadImageToStorage = async (
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  role: UploadRole,
  file: File
): Promise<HandlerResult<string, UploadServiceError>> => {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `uploads/${projectId}/${role}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('sdeume-storage')
    .upload(filePath, uint8Array, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return failure(500, uploadErrorCodes.storageError, uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('sdeume-storage').getPublicUrl(filePath);

  return success(publicUrl);
};

const createUploadRecord = async (
  supabase: SupabaseClient,
  userId: string,
  input: UploadImageInput,
  originalUrl: string
): Promise<HandlerResult<Upload, UploadServiceError>> => {
  // Verify project exists and belongs to user
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', input.projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    return failure(
      404,
      uploadErrorCodes.invalidProject,
      'Project not found or not owned by user'
    );
  }

  const { data, error } = await supabase
    .from('uploads')
    .insert({
      project_id: input.projectId,
      user_id: userId,
      role: input.role,
      original_url: originalUrl,
      bucket_type: input.bucketType || null,
      face_yaw: input.faceYaw || null,
      smile_score: input.smileScore || null,
      quality_score: input.qualityScore || null,
      is_selected: true,
      crop_mode: 'original',
    })
    .select()
    .single();

  if (error) {
    return failure(500, uploadErrorCodes.uploadError, error.message);
  }

  return success(mapRowToUpload(data), 201);
};

const getUploadsByProjectId = async (
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<HandlerResult<Upload[], UploadServiceError>> => {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    return failure(500, uploadErrorCodes.fetchError, error.message);
  }

  return success(data.map(mapRowToUpload));
};

const deleteUpload = async (
  supabase: SupabaseClient,
  uploadId: string,
  userId: string
): Promise<HandlerResult<{ deleted: boolean }, UploadServiceError>> => {
  // Get the upload first to find the file path
  const { data: upload, error: fetchError } = await supabase
    .from('uploads')
    .select('*')
    .eq('id', uploadId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !upload) {
    return failure(404, uploadErrorCodes.notFound, 'Upload not found');
  }

  // Extract file path from URL and delete from storage
  const originalUrl = upload.original_url as string;
  if (originalUrl.includes('sdeume-storage')) {
    const urlParts = originalUrl.split('sdeume-storage/');
    if (urlParts[1]) {
      await supabase.storage.from('sdeume-storage').remove([urlParts[1]]);
    }
  }

  // Delete the database record
  const { error: deleteError } = await supabase
    .from('uploads')
    .delete()
    .eq('id', uploadId)
    .eq('user_id', userId);

  if (deleteError) {
    return failure(500, uploadErrorCodes.deleteError, deleteError.message);
  }

  return success({ deleted: true });
};

// =============================================================================
// Chainable Routes (for Hono RPC type inference)
// =============================================================================

export const uploadRoutes = new Hono<AppEnv>()
  // POST /upload - Upload a single image
  .post('/', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Auth check
    const { user, error: authError } = await getAuthUser(c, supabase);
    if (!user) {
      return respond(c, failure(401, 'UNAUTHORIZED', authError || 'Unauthorized'));
    }

    // Parse form data
    const formData = await c.req.formData().catch(() => null);
    if (!formData) {
      return respond(c, failure(400, 'INVALID_INPUT', 'Invalid form data'));
    }

    const file = formData.get('file') as File | null;
    const metadata = formData.get('metadata') as string | null;

    if (!file) {
      return respond(c, failure(400, 'INVALID_INPUT', 'No file provided'));
    }

    // Parse metadata
    let parsedMetadata: UploadImageInput;
    try {
      parsedMetadata = UploadImageSchema.parse(JSON.parse(metadata || '{}'));
    } catch {
      return respond(c, failure(400, 'INVALID_INPUT', 'Invalid metadata'));
    }

    // Upload to storage
    const uploadResult = await uploadImageToStorage(
      supabase,
      user.id,
      parsedMetadata.projectId,
      parsedMetadata.role,
      file
    );

    if (!uploadResult.ok) {
      const errorResult = uploadResult as ErrorResult<UploadServiceError, unknown>;
      logger.error('Failed to upload image to storage', errorResult.error.message);
      return respond(c, uploadResult);
    }

    // Create database record
    const result = await createUploadRecord(
      supabase,
      user.id,
      parsedMetadata,
      uploadResult.data
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<UploadServiceError, unknown>;
      logger.error('Failed to create upload record', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Image uploaded successfully', { uploadId: result.data.id });
    return respond(c, result);
  })

  // GET /upload/project/:projectId - Get all uploads for a project
  .get('/project/:projectId', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Auth check
    const { user, error: authError } = await getAuthUser(c, supabase);
    if (!user) {
      return respond(c, failure(401, 'UNAUTHORIZED', authError || 'Unauthorized'));
    }

    // Parse params
    const parsedParams = ProjectIdParamSchema.safeParse({
      projectId: c.req.param('projectId'),
    });

    if (!parsedParams.success) {
      return respond(c, failure(400, 'INVALID_PARAMS', 'Invalid project ID'));
    }

    const result = await getUploadsByProjectId(
      supabase,
      parsedParams.data.projectId,
      user.id
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<UploadServiceError, unknown>;
      logger.error('Failed to fetch uploads', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  })

  // DELETE /upload/:uploadId - Delete an upload
  .delete('/:uploadId', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Auth check
    const { user, error: authError } = await getAuthUser(c, supabase);
    if (!user) {
      return respond(c, failure(401, 'UNAUTHORIZED', authError || 'Unauthorized'));
    }

    // Parse params
    const parsedParams = UploadIdParamSchema.safeParse({
      uploadId: c.req.param('uploadId'),
    });

    if (!parsedParams.success) {
      return respond(c, failure(400, 'INVALID_PARAMS', 'Invalid upload ID'));
    }

    const result = await deleteUpload(supabase, parsedParams.data.uploadId, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<UploadServiceError, unknown>;
      if (errorResult.error.code === uploadErrorCodes.notFound) {
        logger.warn('Upload not found', parsedParams.data.uploadId);
      } else {
        logger.error('Failed to delete upload', errorResult.error.message);
      }
      return respond(c, result);
    }

    logger.info('Upload deleted successfully', { uploadId: parsedParams.data.uploadId });
    return respond(c, result);
  });

// =============================================================================
// Legacy Registration
// =============================================================================

export const registerUploadRoutes = (app: Hono<AppEnv>) => {
  app.route('/upload', uploadRoutes);
};
