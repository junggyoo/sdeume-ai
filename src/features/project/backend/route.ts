import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectIdParamSchema,
} from './schema';
import {
  createProject,
  getProjectById,
  getProjectsByUserId,
  updateProject,
} from './service';
import { projectErrorCodes, type ProjectServiceError } from './error';

export const registerProjectRoutes = (app: Hono<AppEnv>) => {
  // GET /projects - Get all projects for current user
  app.get('/projects', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get user from auth header or session
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
