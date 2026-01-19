import { Hono } from 'hono';
import { z } from 'zod';
import {
  success,
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  getUserActiveFaceModels,
  upsertUserFaceModel,
  deactivateUserFaceModel,
} from '@/backend/services/user-face-model.service';
import { getFaceDataStatus, type UserFaceModel } from '@/features/face/types';

// =============================================================================
// Schemas
// =============================================================================

const UpsertFaceModelSchema = z.object({
  role: z.enum(['bride', 'groom']),
  loraModelId: z.string().uuid(),
});

const DeactivateFaceModelSchema = z.object({
  modelId: z.string().uuid(),
});

// =============================================================================
// Routes
// =============================================================================

export const userFaceModelRoutes = new Hono<AppEnv>()
  // GET / - Get current user's active face models
  .get('/', async (c) => {
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

    const result = await getUserActiveFaceModels(supabase, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      logger.error('Failed to fetch face models', errorResult.error.message);
      return respond(c, result);
    }

    return respond(c, result);
  })

  // GET /status - Get face data status summary
  .get('/status', async (c) => {
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

    const result = await getUserActiveFaceModels(supabase, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      logger.error('Failed to fetch face status', errorResult.error.message);
      return respond(c, result);
    }

    const status = getFaceDataStatus(result.data as UserFaceModel[]);
    return respond(c, success(status));
  })

  // POST / - Create or update a face model
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
    const parsed = UpsertFaceModelSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, 'INVALID_INPUT', 'Invalid input', parsed.error.format())
      );
    }

    const { role, loraModelId } = parsed.data;
    const result = await upsertUserFaceModel(supabase, user.id, role, loraModelId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      logger.error('Failed to upsert face model', errorResult.error.message);
      return respond(c, result);
    }

    logger.info(`Face model upserted for user ${user.id}, role: ${role}`);
    return respond(c, result);
  })

  // DELETE / - Deactivate a face model
  .delete('/', async (c) => {
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
    const parsed = DeactivateFaceModelSchema.safeParse(body);

    if (!parsed.success) {
      return respond(
        c,
        failure(400, 'INVALID_INPUT', 'Invalid input', parsed.error.format())
      );
    }

    const result = await deactivateUserFaceModel(
      supabase,
      user.id,
      parsed.data.modelId
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      logger.error('Failed to deactivate face model', errorResult.error.message);
      return respond(c, result);
    }

    logger.info(`Face model ${parsed.data.modelId} deactivated for user ${user.id}`);
    return respond(c, success({ deactivated: true }));
  });
