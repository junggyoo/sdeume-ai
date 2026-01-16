import { Hono } from 'hono';
import { z } from 'zod';
import {
  success,
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, getConfig, type AppEnv } from '@/backend/hono/context';
import {
  createShootJob,
  getShootJobById,
  handleFalWebhookCompletion,
  handleFalWebhookFailure,
  updateJobWithFalJobIds,
} from '@/backend/services/shoot.service';
import {
  startLoraTraining,
  verifyFalWebhookSignature,
  parseFalWebhookPayload,
  createTrainingZipUrl,
  type FalClientConfig,
} from '@/backend/services/fal-client';
import type { ShootErrorCode, FalWebhookPayload } from '@/features/shooting/types';
import { SHOOT_ERROR_CODES } from '@/features/shooting/types';

// =============================================================================
// Schemas
// =============================================================================

const StartShootSchema = z.object({
  projectId: z.string().uuid(),
  themeId: z.string().uuid(),
});

const JobIdParamSchema = z.object({
  jobId: z.string().uuid(),
});

// =============================================================================
// Helper: Get Auth User
// =============================================================================

const getAuthUser = async (c: { req: { header: (name: string) => string | undefined }; var: { supabase: unknown } }, supabase: ReturnType<typeof getSupabase>) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return { user: null, error: 'Authorization header required' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Invalid token' };
  }

  return { user, error: null };
};

// =============================================================================
// Chainable Routes (for Hono RPC type inference)
// =============================================================================

export const shootRoutes = new Hono<AppEnv>()
  // POST /shoot/start - Start Fal.ai LoRA training
  .post('/start', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const config = getConfig(c);

    // Auth check
    const { user, error: authError } = await getAuthUser(c, supabase);
    if (!user) {
      return respond(c, failure(401, 'UNAUTHORIZED', authError || 'Unauthorized'));
    }

    // Parse body
    const body = await c.req.json().catch(() => ({}));
    const parsedBody = StartShootSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(400, 'INVALID_INPUT', 'Invalid input', parsedBody.error.format())
      );
    }

    // Create shoot job
    const input = parsedBody.data as { projectId: string; themeId: string };
    const createResult = await createShootJob(supabase, user.id, input);

    if (!createResult.ok) {
      const errorResult = createResult as ErrorResult<ShootErrorCode, unknown>;
      logger.error('Failed to create shoot job', errorResult.error.message);
      return respond(c, createResult);
    }

    const shootJob = createResult.data;

    // Start Fal.ai training for both groom and bride
    const falConfig: FalClientConfig = {
      apiKey: config.fal?.apiKey || process.env.FAL_KEY || '',
      webhookSecret: config.fal?.webhookSecret || process.env.FAL_WEBHOOK_SECRET || '',
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/shoot/webhooks/fal`,
    };

    // Create ZIP URLs for training images
    const groomZipUrl = createTrainingZipUrl(parsedBody.data.projectId, 'groom');
    const brideZipUrl = createTrainingZipUrl(parsedBody.data.projectId, 'bride');

    // Start training in parallel
    const [groomResult, brideResult] = await Promise.all([
      startLoraTraining(falConfig, {
        imagesZipUrl: groomZipUrl,
        role: 'groom',
        projectId: parsedBody.data.projectId,
      }),
      startLoraTraining(falConfig, {
        imagesZipUrl: brideZipUrl,
        role: 'bride',
        projectId: parsedBody.data.projectId,
      }),
    ]);

    // Check for training start errors
    if (!groomResult.ok || !brideResult.ok) {
      const errorMessage = !groomResult.ok
        ? (groomResult as ErrorResult<string, unknown>).error.message
        : (brideResult as ErrorResult<string, unknown>).error.message;

      logger.error('Failed to start Fal.ai training', errorMessage);

      // Update job status to failed
      // Note: Job is already created, so we should update its status
      return respond(
        c,
        failure(500, SHOOT_ERROR_CODES.FAL_TRAINING_START_ERROR, errorMessage)
      );
    }

    // Update job with Fal job IDs
    const updateResult = await updateJobWithFalJobIds(
      supabase,
      shootJob.id,
      groomResult.data.requestId,
      brideResult.data.requestId
    );

    if (!updateResult.ok) {
      logger.error('Failed to update job with Fal job IDs');
    }

    logger.info('Shoot job created and training started', {
      jobId: shootJob.id,
      groomFalJobId: groomResult.data.requestId,
      brideFalJobId: brideResult.data.requestId,
    });

    return respond(c, success(updateResult.ok ? updateResult.data : shootJob, 201));
  })

  // GET /shoot/:jobId/status - Get shoot job status
  .get('/:jobId/status', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Auth check
    const { user, error: authError } = await getAuthUser(c, supabase);
    if (!user) {
      return respond(c, failure(401, 'UNAUTHORIZED', authError || 'Unauthorized'));
    }

    // Parse params
    const parsedParams = JobIdParamSchema.safeParse({
      jobId: c.req.param('jobId'),
    });

    if (!parsedParams.success) {
      return respond(c, failure(400, 'INVALID_PARAMS', 'Invalid job ID'));
    }

    // Get job status
    const result = await getShootJobById(supabase, parsedParams.data.jobId, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ShootErrorCode, unknown>;
      if (errorResult.error.code === SHOOT_ERROR_CODES.JOB_NOT_FOUND) {
        logger.warn('Shoot job not found', parsedParams.data.jobId);
      } else {
        logger.error('Failed to fetch shoot job', errorResult.error.message);
      }
      return respond(c, result);
    }

    return respond(c, result);
  })

  // POST /shoot/webhooks/fal - Fal.ai webhook handler
  .post('/webhooks/fal', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const config = getConfig(c);

    // Get raw body for signature verification
    const rawBody = await c.req.text();
    const signature = c.req.header('X-Fal-Signature') || '';

    // Verify signature
    const webhookSecret = config.fal?.webhookSecret || process.env.FAL_WEBHOOK_SECRET || '';
    const isValid = verifyFalWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      logger.warn('Invalid Fal webhook signature');
      return respond(
        c,
        failure(401, SHOOT_ERROR_CODES.WEBHOOK_SIGNATURE_INVALID, 'Invalid webhook signature')
      );
    }

    // Parse payload
    let payload: FalWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return respond(c, failure(400, 'INVALID_PAYLOAD', 'Invalid JSON payload'));
    }

    const parseResult = parseFalWebhookPayload(payload);
    if (!parseResult.ok) {
      const errorMessage = (parseResult as { ok: false; error: { message: string } }).error.message;
      logger.error('Failed to parse Fal webhook payload', errorMessage);
      return respond(c, failure(400, 'INVALID_PAYLOAD', errorMessage));
    }

    const parsedPayload = parseResult.data;

    logger.info('Received Fal webhook', {
      requestId: parsedPayload.requestId,
      status: parsedPayload.status,
    });

    // Handle based on status
    if (parsedPayload.status === 'COMPLETED' && parsedPayload.loraUrl) {
      const result = await handleFalWebhookCompletion(
        supabase,
        parsedPayload.requestId,
        parsedPayload.loraUrl
      );

      if (!result.ok) {
        const errorResult = result as ErrorResult<ShootErrorCode, unknown>;
        logger.error('Failed to handle Fal completion webhook', errorResult.error.message);
        return respond(c, result);
      }

      logger.info('Fal training completed', {
        requestId: parsedPayload.requestId,
        status: result.data.status,
      });

      return respond(c, success({ received: true }));
    }

    if (parsedPayload.status === 'FAILED') {
      const result = await handleFalWebhookFailure(
        supabase,
        parsedPayload.requestId,
        parsedPayload.errorMessage || 'Training failed',
        parsedPayload.errorCode
      );

      if (!result.ok) {
        const errorResult = result as ErrorResult<ShootErrorCode, unknown>;
        logger.error('Failed to handle Fal failure webhook', errorResult.error.message);
      }

      return respond(c, success({ received: true }));
    }

    // For IN_PROGRESS and IN_QUEUE, just acknowledge
    return respond(c, success({ received: true }));
  });

// =============================================================================
// Legacy Registration
// =============================================================================

export const registerShootRoutes = (app: Hono<AppEnv>) => {
  app.route('/shoot', shootRoutes);
};
