import { Hono } from 'hono';
import { z } from 'zod';
import {
  failure,
  respond,
} from '@/backend/http/response';
import { getSupabase, getConfig, type AppEnv } from '@/backend/hono/context';
import type {
  PromptOverrides,
  NodeOverrides,
  QualityIssueId,
} from '@/features/admin-prompt-lab/types';
import {
  getThemeConfig,
  getAllThemeConfigs,
  assemblePrompts,
  buildModalRequest,
  validatePromptOverrides,
  validateNodeOverrides,
  insertPromptTest,
  getPromptTestById,
  getPromptTestStatus,
  getPromptTestHistory,
  updatePromptTest,
  deletePromptTest,
} from '@/backend/services/admin-prompt-test.service';
import { enqueuePromptTestJob } from '@/backend/services/qstash.service';
import type { ThemeSlug, ShotType } from '@/features/shooting/types';

// =============================================================================
// Schemas
// =============================================================================

const promptOverridesSchema = z.object({
  mainPositive: z.string().optional(),
  mainNegative: z.string().optional(),
  groomFacePositive: z.string().optional(),
  groomFaceNegative: z.string().optional(),
  brideFacePositive: z.string().optional(),
  brideFaceNegative: z.string().optional(),
  handPositive: z.string().optional(),
  handNegative: z.string().optional(),
}).optional();

const nodeOverridesSchema = z.object({
  samplerName: z.string().optional(),
  scheduler: z.string().optional(),
  cfg: z.number().optional(),
  steps: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  groomDenoise: z.number().optional(),
  groomSteps: z.number().optional(),
  groomCfg: z.number().optional(),
  groomGuideSize: z.number().optional(),
  brideDenoise: z.number().optional(),
  brideSteps: z.number().optional(),
  brideCfg: z.number().optional(),
  brideGuideSize: z.number().optional(),
  handDenoise: z.number().optional(),
  handSteps: z.number().optional(),
  handCfg: z.number().optional(),
  handGuideSize: z.number().optional(),
  faceThreshold: z.number().optional(),
  faceDilation: z.number().optional(),
  faceCropFactor: z.number().optional(),
  handThreshold: z.number().optional(),
  handCropFactor: z.number().optional(),
}).optional();

const generateRequestSchema = z.object({
  themeSlug: z.enum(['white_studio', 'garden_studio', 'classic_studio']),
  shotType: z.enum(['full_body', 'closeup']),
  promptOverrides: promptOverridesSchema,
  nodeOverrides: nodeOverridesSchema,
  groomLoraUrl: z.string().url(),
  brideLoraUrl: z.string().url(),
  seed: z.number().optional(),
  extraStyleTags: z.string().optional(),
  count: z.number().min(1).max(50).default(1),
});

const historyQuerySchema = z.object({
  themeSlug: z.enum(['white_studio', 'garden_studio', 'classic_studio']).optional(),
  qualityIssue: z.string().optional(),
  isFavorite: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const updateRequestSchema = z.object({
  qualityIssues: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

// =============================================================================
// Auth Helper
// =============================================================================

const getAuthUser = async (
  c: { req: { header: (name: string) => string | undefined } },
  supabase: ReturnType<typeof getSupabase>
) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (error || !user) {
    return null;
  }

  return user;
};

// =============================================================================
// Routes
// =============================================================================

export const adminPromptTestRoutes = new Hono<AppEnv>()
  // ==========================================================================
  // POST /generate - Queue async image generation
  // ==========================================================================
  .post('/generate', async (c) => {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c, supabase);
    if (!user) {
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    // Parse and validate body
    const rawBody = await c.req.json().catch(() => ({}));
    const parsedBody = generateRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return c.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsedBody.error.message } },
        400
      );
    }

    const body = parsedBody.data;

      // Validate overrides
      const promptValidation = validatePromptOverrides(body.promptOverrides as PromptOverrides);
      if (!promptValidation.valid) {
        return c.json(
          { ok: false, error: { code: 'INVALID_INPUT', message: promptValidation.errors.join(', ') } },
          400
        );
      }

      const nodeValidation = validateNodeOverrides(body.nodeOverrides as NodeOverrides);
      if (!nodeValidation.valid) {
        return c.json(
          { ok: false, error: { code: 'INVALID_INPUT', message: nodeValidation.errors.join(', ') } },
          400
        );
      }

      // Get theme config
      const themeConfig = await getThemeConfig(body.themeSlug as ThemeSlug);
      if (!themeConfig) {
        return c.json(
          { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid theme slug' } },
          400
        );
      }

      // Build Modal request (for seed/trigger extraction)
      const modalRequest = buildModalRequest({
        themeSlug: body.themeSlug as ThemeSlug,
        shotType: body.shotType as ShotType,
        groomLoraUrl: body.groomLoraUrl,
        brideLoraUrl: body.brideLoraUrl,
        promptOverrides: body.promptOverrides as PromptOverrides,
        nodeOverrides: body.nodeOverrides as NodeOverrides,
        seed: body.seed,
        extraStyleTags: body.extraStyleTags,
      });

      // Assemble prompts for logging/storage
      const assembledPrompts = assemblePrompts({
        themeConfig,
        shotType: body.shotType as ShotType,
        groomTrigger: modalRequest.groomTrigger,
        brideTrigger: modalRequest.brideTrigger,
        promptOverrides: body.promptOverrides as PromptOverrides,
        extraStyleTags: body.extraStyleTags,
        includeMainTriggers: modalRequest.includeMainTriggers,
      });

      const totalCount = body.count ?? 1;

      // Insert queued record into DB
      const insertResult = await insertPromptTest(supabase, {
        userId: user.id,
        themeSlug: body.themeSlug as ThemeSlug,
        shotType: body.shotType as ShotType,
        promptOverrides: body.promptOverrides as PromptOverrides,
        nodeOverrides: body.nodeOverrides as NodeOverrides,
        seed: modalRequest.seed,
        extraStyleTags: body.extraStyleTags,
        groomLoraUrl: body.groomLoraUrl,
        brideLoraUrl: body.brideLoraUrl,
        assembledPrompts,
        totalCount,
      });

      if (!insertResult.ok) {
        return respond(c, insertResult);
      }

      const testId = insertResult.data.id;

      // Enqueue background job via QStash
      try {
        await enqueuePromptTestJob(testId);
      } catch (err) {
        console.error('Failed to enqueue prompt test job:', err);
        // Job failed to enqueue but DB record exists - mark as failed
      }

      return c.json(
        {
          ok: true,
          data: {
            testId,
            status: 'queued',
            assembledPrompts,
            seed: modalRequest.seed,
          },
        },
        201
      );
    }
  )

  // ==========================================================================
  // GET /status/:testId - Poll generation status
  // ==========================================================================
  .get('/status/:testId', async (c) => {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c, supabase);
    if (!user) {
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const testId = c.req.param('testId');
    const result = await getPromptTestStatus(supabase, testId);
    return respond(c, result);
  })

  // ==========================================================================
  // GET /history - Get test history
  // ==========================================================================
  .get('/history', async (c) => {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c, supabase);
    if (!user) {
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    // Parse query params
    const rawQuery = {
      themeSlug: c.req.query('themeSlug'),
      qualityIssue: c.req.query('qualityIssue'),
      isFavorite: c.req.query('isFavorite'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    };
    const parsedQuery = historyQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) {
      return c.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsedQuery.error.message } },
        400
      );
    }
    const query = parsedQuery.data;

      const result = await getPromptTestHistory(supabase, {
        themeSlug: query.themeSlug as ThemeSlug,
        qualityIssue: query.qualityIssue as QualityIssueId,
        isFavorite: query.isFavorite,
        limit: query.limit,
        offset: query.offset,
      });

      return respond(c, result);
    }
  )

  // ==========================================================================
  // GET /history/:id - Get single test
  // ==========================================================================
  .get('/history/:id', async (c) => {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c, supabase);
    if (!user) {
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const testId = c.req.param('id');

    const result = await getPromptTestById(supabase, testId);
    return respond(c, result);
  })

  // ==========================================================================
  // PUT /history/:id - Update test (quality issues, notes, favorite)
  // ==========================================================================
  .put('/history/:id', async (c) => {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c, supabase);
    if (!user) {
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const testId = c.req.param('id');

    // Parse and validate body
    const rawBody = await c.req.json().catch(() => ({}));
    const parsedBody = updateRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return c.json(
        { ok: false, error: { code: 'INVALID_INPUT', message: parsedBody.error.message } },
        400
      );
    }
    const body = parsedBody.data;

      const result = await updatePromptTest(supabase, testId, {
        qualityIssues: body.qualityIssues as QualityIssueId[],
        notes: body.notes,
        isFavorite: body.isFavorite,
      });

      return respond(c, result);
    }
  )

  // ==========================================================================
  // DELETE /history/:id - Delete test
  // ==========================================================================
  .delete('/history/:id', async (c) => {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c, supabase);
    if (!user) {
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const testId = c.req.param('id');

    const result = await deletePromptTest(supabase, testId);

    if (!result.ok) {
      return respond(c, result);
    }

    return c.json({ ok: true, data: { deleted: true } }, 200);
  })

  // ==========================================================================
  // GET /themes - Get available themes
  // ==========================================================================
  .get('/themes', async (c) => {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c, supabase);
    if (!user) {
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const themes = await getAllThemeConfigs();
    return c.json({ ok: true, data: themes }, 200);
  })

  // ==========================================================================
  // GET /themes/:slug - Get single theme config
  // ==========================================================================
  .get('/themes/:slug', async (c) => {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c, supabase);
    if (!user) {
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    const slug = c.req.param('slug') as ThemeSlug;
    const theme = await getThemeConfig(slug);

    if (!theme) {
      return c.json(
        { ok: false, error: { code: 'THEME_NOT_FOUND', message: 'Theme not found' } },
        404
      );
    }

    return c.json({ ok: true, data: theme }, 200);
  });
