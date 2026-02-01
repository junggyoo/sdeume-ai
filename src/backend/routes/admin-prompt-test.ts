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
  PromptTestImage,
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
  getPromptTestHistory,
  updatePromptTest,
  deletePromptTest,
} from '@/backend/services/admin-prompt-test.service';
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
  count: z.number().min(1).max(12).default(1),
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
  // POST /generate - Generate test image
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
    const config = getConfig(c);

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

      // Build Modal request
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

      // Call Modal API
      const startTime = Date.now();
      const endpointUrl = config.modal?.endpointUrl;

      if (!endpointUrl) {
        return c.json(
          { ok: false, error: { code: 'GENERATION_ERROR', message: 'Modal endpoint not configured' } },
          500
        );
      }

      try {
        const BATCH_SIZE = 4;
        const totalCount = body.count ?? 1;

        // Build batches: split into chunks of BATCH_SIZE
        const batches: number[] = [];
        let remaining = totalCount;
        while (remaining > 0) {
          batches.push(Math.min(remaining, BATCH_SIZE));
          remaining -= BATCH_SIZE;
        }

        type ModalImage = { base64: string; content_type: string; width: number; height: number };

        const fetchBatch = async (batchCount: number): Promise<ModalImage[]> => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout

          const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...modalRequest,
              count: batchCount,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Modal API error');
          }

          const data = await response.json();
          return data.images;
        };

        // Execute batches in parallel
        const results = await Promise.allSettled(batches.map((batchCount) => fetchBatch(batchCount)));

        // Collect successful images
        const allImages: ModalImage[] = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            allImages.push(...result.value);
          }
        }

        // If no images at all, return error
        if (allImages.length === 0) {
          // Check if any was a timeout
          const hasTimeout = results.some(
            (r) => r.status === 'rejected' && (r.reason?.message?.includes('abort') || r.reason?.message?.includes('AbortError'))
          );
          if (hasTimeout) {
            return c.json(
              { ok: false, error: { code: 'GENERATION_TIMEOUT', message: 'Request timed out' } },
              408
            );
          }
          return c.json(
            { ok: false, error: { code: 'GENERATION_ERROR', message: 'All batches failed' } },
            500
          );
        }

        const generationTimeMs = Date.now() - startTime;

        // Process images
        const images: PromptTestImage[] = allImages.map((img) => ({
          base64: img.base64,
          contentType: img.content_type,
          width: img.width,
          height: img.height,
        }));

        // Save to database
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
          images,
          generationTimeMs,
          assembledPrompts,
        });

        if (!insertResult.ok) {
          return respond(c, insertResult);
        }

        return c.json(
          {
            ok: true,
            data: {
              testId: insertResult.data.id,
              images,
              assembledPrompts,
              generationTimeMs,
              seed: modalRequest.seed,
            },
          },
          201
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (message.includes('abort') || message.includes('AbortError')) {
          return c.json(
            { ok: false, error: { code: 'GENERATION_TIMEOUT', message: 'Request timed out' } },
            408
          );
        }

        return c.json(
          { ok: false, error: { code: 'GENERATION_ERROR', message } },
          500
        );
      }
    }
  )

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
