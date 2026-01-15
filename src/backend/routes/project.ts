import type { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  success,
  failure,
  respond,
  type HandlerResult,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import type { Project } from '@/features/project/types';

// =============================================================================
// Error Codes
// =============================================================================

const projectErrorCodes = {
  notFound: 'PROJECT_NOT_FOUND',
  createError: 'PROJECT_CREATE_ERROR',
  updateError: 'PROJECT_UPDATE_ERROR',
  fetchError: 'PROJECT_FETCH_ERROR',
  unauthorized: 'PROJECT_UNAUTHORIZED',
} as const;

type ProjectServiceError =
  (typeof projectErrorCodes)[keyof typeof projectErrorCodes];

// =============================================================================
// Schemas
// =============================================================================

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z
    .enum([
      'draft',
      'uploading',
      'optimizing',
      'theme_selecting',
      'training',
      'generating',
      'completed',
      'failed',
    ])
    .optional(),
  currentStep: z.number().int().min(1).max(5).optional(),
  selectedThemeId: z.string().uuid().optional(),
});

const ProjectIdParamSchema = z.object({
  projectId: z.string().uuid(),
});

type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// =============================================================================
// Helpers
// =============================================================================

const mapRowToProject = (row: Record<string, unknown>): Project => ({
  id: row.id as string,
  userId: row.user_id as string,
  name: row.name as string | null,
  status: row.status as Project['status'],
  currentStep: ((row.current_step as number) || 1) as Project['currentStep'],
  selectedThemeId: row.selected_theme_id as string | null,
  planId: row.plan_id as string | null,
  groomUploadCount: (row.groom_upload_count as number) || 0,
  brideUploadCount: (row.bride_upload_count as number) || 0,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// =============================================================================
// Service Functions
// =============================================================================

const createProject = async (
  supabase: SupabaseClient,
  userId: string,
  input: CreateProjectInput
): Promise<HandlerResult<Project, ProjectServiceError>> => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.name || '새 프로젝트',
      status: 'uploading',
      current_step: 1,
    })
    .select()
    .single();

  if (error) {
    return failure(500, projectErrorCodes.createError, error.message);
  }

  return success(mapRowToProject(data));
};

const getProjectById = async (
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<HandlerResult<Project, ProjectServiceError>> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, projectErrorCodes.notFound, 'Project not found');
    }
    return failure(500, projectErrorCodes.fetchError, error.message);
  }

  return success(mapRowToProject(data));
};

const getProjectsByUserId = async (
  supabase: SupabaseClient,
  userId: string
): Promise<HandlerResult<Project[], ProjectServiceError>> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return failure(500, projectErrorCodes.fetchError, error.message);
  }

  return success((data || []).map(mapRowToProject));
};

const updateProject = async (
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<HandlerResult<Project, ProjectServiceError>> => {
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.currentStep !== undefined) updateData.current_step = input.currentStep;
  if (input.selectedThemeId !== undefined)
    updateData.selected_theme_id = input.selectedThemeId;

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, projectErrorCodes.notFound, 'Project not found');
    }
    return failure(500, projectErrorCodes.updateError, error.message);
  }

  return success(mapRowToProject(data));
};

// =============================================================================
// Route Registration
// =============================================================================

export const registerProjectRoutes = (app: Hono<AppEnv>) => {
  // GET /projects - Get all projects for current user
  app.get('/projects', async (c) => {
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

    const result = await getProjectsByUserId(supabase, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ProjectServiceError, unknown>;
      logger.error('Failed to fetch projects', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // POST /projects - Create a new project
  app.post('/projects', async (c) => {
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
    const parsedBody = CreateProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(400, 'INVALID_INPUT', 'Invalid input', parsedBody.error.format())
      );
    }

    const result = await createProject(supabase, user.id, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ProjectServiceError, unknown>;
      logger.error('Failed to create project', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });

  // GET /projects/:projectId - Get a specific project
  app.get('/projects/:projectId', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const parsedParams = ProjectIdParamSchema.safeParse({
      projectId: c.req.param('projectId'),
    });

    if (!parsedParams.success) {
      return respond(c, failure(400, 'INVALID_PARAMS', 'Invalid project ID'));
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

    const result = await getProjectById(
      supabase,
      parsedParams.data.projectId,
      user.id
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ProjectServiceError, unknown>;
      if (errorResult.error.code === projectErrorCodes.notFound) {
        logger.warn('Project not found', parsedParams.data.projectId);
      } else {
        logger.error('Failed to fetch project', errorResult.error.message);
      }
      return respond(c, result);
    }

    return respond(c, result);
  });

  // PATCH /projects/:projectId - Update a project
  app.patch('/projects/:projectId', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const parsedParams = ProjectIdParamSchema.safeParse({
      projectId: c.req.param('projectId'),
    });

    if (!parsedParams.success) {
      return respond(c, failure(400, 'INVALID_PARAMS', 'Invalid project ID'));
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

    const body = await c.req.json().catch(() => ({}));
    const parsedBody = UpdateProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(400, 'INVALID_INPUT', 'Invalid input', parsedBody.error.format())
      );
    }

    const result = await updateProject(
      supabase,
      parsedParams.data.projectId,
      user.id,
      parsedBody.data
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ProjectServiceError, unknown>;
      logger.error('Failed to update project', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });
};
