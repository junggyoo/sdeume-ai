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
import type {
  Generation,
  GenerationRow,
  GenerationImage,
  GenerationStatus,
} from '@/features/generation/types';

// =============================================================================
// Schemas
// =============================================================================

const CreateGenerationSchema = z.object({
  projectId: z.string().uuid(),
  themeId: z.string().uuid().optional(),
});

const GenerationIdParamSchema = z.object({
  generationId: z.string().uuid(),
});

type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>;

// =============================================================================
// Error Codes
// =============================================================================

const generationErrorCodes = {
  notFound: 'GENERATION_NOT_FOUND',
  createError: 'GENERATION_CREATE_ERROR',
  fetchError: 'GENERATION_FETCH_ERROR',
  invalidProject: 'GENERATION_INVALID_PROJECT',
} as const;

type GenerationServiceError =
  (typeof generationErrorCodes)[keyof typeof generationErrorCodes];

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_IMAGE_URLS = Array.from(
  { length: 12 },
  (_, i) => `https://via.placeholder.com/512?text=Image+${i + 1}`
);

// =============================================================================
// Helpers
// =============================================================================

const mapRowToGeneration = (row: GenerationRow): Generation => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  modalJobId: row.modal_job_id,
  themeId: row.theme_id,
  prompt: row.prompt,
  parameters: row.parameters || {},
  status: row.status as GenerationStatus,
  images: row.images || [],
  startedAt: row.started_at,
  completedAt: row.completed_at,
  errorMessage: row.error_message,
  createdAt: row.created_at,
});

/**
 * Calculate mock status and images based on elapsed time since creation.
 * This is stateless - it only modifies the response, not the database.
 *
 * Timeline:
 * - 0-5s:   queued
 * - 5-15s:  training
 * - 15-40s: generating (1 image per 2 seconds)
 * - 40s+:   completed (all 12 images)
 */
const calculateMockStatusAndImages = (
  createdAt: string
): { status: GenerationStatus; images: GenerationImage[] } => {
  const elapsedSeconds = (Date.now() - new Date(createdAt).getTime()) / 1000;

  // Phase 1: 0-5s = queued
  if (elapsedSeconds < 5) {
    return { status: 'queued', images: [] };
  }

  // Phase 2: 5-15s = training
  if (elapsedSeconds < 15) {
    return { status: 'training', images: [] };
  }

  // Phase 3: 15-40s = generating (1 image per 2 seconds)
  if (elapsedSeconds < 40) {
    const generatingSeconds = elapsedSeconds - 15;
    const imageCount = Math.min(12, Math.floor(generatingSeconds / 2) + 1);
    const images: GenerationImage[] = MOCK_IMAGE_URLS.slice(0, imageCount).map(
      (url) => ({
        url,
        is_blur: true,
      })
    );
    return { status: 'generating', images };
  }

  // Phase 4: 40s+ = completed (all 12 images, unblurred)
  const images: GenerationImage[] = MOCK_IMAGE_URLS.map((url) => ({
    url,
    is_blur: false,
  }));
  return { status: 'completed', images };
};

// =============================================================================
// Service Functions
// =============================================================================

const createGeneration = async (
  supabase: SupabaseClient,
  userId: string,
  input: CreateGenerationInput
): Promise<HandlerResult<Generation, GenerationServiceError>> => {
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
      generationErrorCodes.invalidProject,
      'Project not found or not owned by user'
    );
  }

  const { data, error } = await supabase
    .from('generations')
    .insert({
      project_id: input.projectId,
      user_id: userId,
      theme_id: input.themeId || null,
      status: 'queued',
      images: [],
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return failure(500, generationErrorCodes.createError, error.message);
  }

  return success(mapRowToGeneration(data), 201);
};

const getGenerationById = async (
  supabase: SupabaseClient,
  generationId: string,
  userId: string
): Promise<HandlerResult<Generation, GenerationServiceError>> => {
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', generationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, generationErrorCodes.notFound, 'Generation not found');
    }
    return failure(500, generationErrorCodes.fetchError, error.message);
  }

  const generation = mapRowToGeneration(data);

  // Apply mock status logic for development
  const { status, images } = calculateMockStatusAndImages(generation.createdAt);

  return success({
    ...generation,
    status,
    images,
    completedAt: status === 'completed' ? new Date().toISOString() : null,
  });
};

// =============================================================================
// Chainable Routes (for Hono RPC type inference)
// =============================================================================

export const generationRoutes = new Hono<AppEnv>()
  // POST /generate - Create a new generation job
  .post('/', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'Authorization header required')
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return respond(c, failure(401, 'UNAUTHORIZED', 'Invalid token'));
    }

    const body = await c.req.json().catch(() => ({}));
    const parsedBody = CreateGenerationSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(400, 'INVALID_INPUT', 'Invalid input', parsedBody.error.format())
      );
    }

    const result = await createGeneration(supabase, user.id, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<GenerationServiceError, unknown>;
      logger.error('Failed to create generation', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  })
  // GET /generate/:generationId - Get generation status with mock time-based logic
  .get('/:generationId', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const parsedParams = GenerationIdParamSchema.safeParse({
      generationId: c.req.param('generationId'),
    });

    if (!parsedParams.success) {
      return respond(c, failure(400, 'INVALID_PARAMS', 'Invalid generation ID'));
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'Authorization header required')
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return respond(c, failure(401, 'UNAUTHORIZED', 'Invalid token'));
    }

    const result = await getGenerationById(
      supabase,
      parsedParams.data.generationId,
      user.id
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<GenerationServiceError, unknown>;
      if (errorResult.error.code === generationErrorCodes.notFound) {
        logger.warn('Generation not found', parsedParams.data.generationId);
      } else {
        logger.error('Failed to fetch generation', errorResult.error.message);
      }
      return respond(c, result);
    }

    return respond(c, result);
  });

// =============================================================================
// Legacy Registration (for backward compatibility with other routes)
// =============================================================================

export const registerGenerationRoutes = (app: Hono<AppEnv>) => {
  app.route('/generate', generationRoutes);
};
