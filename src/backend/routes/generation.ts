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
import { getLogger, getSupabase, getConfig, type AppEnv } from '@/backend/hono/context';
import {
  startLoraTrainingForGeneration,
  handleFalWebhookForGeneration,
  triggerModalGeneration,
} from '@/backend/services/generation.service';
import { getUserActiveFaceModels } from '@/backend/services/user-face-model.service';
import { enqueueTrainingJob } from '@/backend/services/qstash.service';
import { verifyFalWebhookSignature, parseFalWebhookPayload, getTrainingStatus } from '@/backend/services/fal-client';
import type {
  Generation,
  GenerationRow,
  GenerationStatus,
} from '@/features/generation/types';
import type { FalWebhookPayload } from '@/features/shooting/types';

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

const ProjectIdParamSchema = z.object({
  projectId: z.string().uuid(),
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
  trainingError: 'GENERATION_TRAINING_ERROR',
  webhookError: 'WEBHOOK_ERROR',
} as const;

type GenerationServiceError =
  (typeof generationErrorCodes)[keyof typeof generationErrorCodes];

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
  // New FK fields
  groomLoraModelId: row.groom_lora_model_id,
  brideLoraModelId: row.bride_lora_model_id,
  // LoRA fields from JOINed lora_models
  groomFalJobId: row.groom_lora?.fal_job_id ?? null,
  groomLoraUrl: row.groom_lora?.model_url ?? null,
  brideFalJobId: row.bride_lora?.fal_job_id ?? null,
  brideLoraUrl: row.bride_lora?.model_url ?? null,
  trainingCompletedAt: row.training_completed_at,
});

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

// Query string for selecting generations with lora_models JOIN
// Migration 0009 adds FK columns: groom_lora_model_id, bride_lora_model_id
const GENERATION_SELECT = `
  *,
  groom_lora:lora_models!groom_lora_model_id(id, model_url, status, fal_job_id),
  bride_lora:lora_models!bride_lora_model_id(id, model_url, status, fal_job_id)
`;

const getGenerationById = async (
  supabase: SupabaseClient,
  generationId: string,
  userId: string
): Promise<HandlerResult<Generation, GenerationServiceError>> => {
  const { data, error } = await supabase
    .from('generations')
    .select(GENERATION_SELECT)
    .eq('id', generationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, generationErrorCodes.notFound, 'Generation not found');
    }
    return failure(500, generationErrorCodes.fetchError, error.message);
  }

  return success(mapRowToGeneration(data as GenerationRow));
};

const getGenerationByProjectId = async (
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<HandlerResult<Generation | null, GenerationServiceError>> => {
  const { data, error } = await supabase
    .from('generations')
    .select(GENERATION_SELECT)
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No generation found - return null instead of 404
      // This is semantically correct: "not found" is not an error, just "not yet created"
      return success(null);
    }
    return failure(500, generationErrorCodes.fetchError, error.message);
  }

  return success(mapRowToGeneration(data as GenerationRow));
};

// =============================================================================
// Chainable Routes (for Hono RPC type inference)
// =============================================================================

export const generationRoutes = new Hono<AppEnv>()
  // POST /generate - Create a new generation job and start LoRA training
  .post('/', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const config = getConfig(c);

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

    // 1. Create generation record
    const createResult = await createGeneration(supabase, user.id, parsedBody.data);

    if (!createResult.ok) {
      const errorResult = createResult as ErrorResult<GenerationServiceError, unknown>;
      logger.error('Failed to create generation', errorResult.error.message);
      return respond(c, createResult);
    }

    const generation = createResult.data;

    // 2. Check for existing LoRA models (Smart Navigation users skip training)
    const faceModelsResult = await getUserActiveFaceModels(supabase, user.id);

    if (faceModelsResult.ok && faceModelsResult.data.length > 0) {
      const faceModels = faceModelsResult.data;
      const groomModel = faceModels.find((m) => m.role === 'groom');
      const brideModel = faceModels.find((m) => m.role === 'bride');

      // If both groom and bride LoRA exist with model URLs, skip training
      if (
        groomModel?.loraModel?.modelUrl &&
        brideModel?.loraModel?.modelUrl
      ) {
        logger.info('Using existing LoRA models, skipping training', {
          generationId: generation.id,
          groomLoraUrl: groomModel.loraModel.modelUrl,
          brideLoraUrl: brideModel.loraModel.modelUrl,
        });

        // Update generation status
        const { data: updatedGeneration, error: updateError } = await supabase
          .from('generations')
          .update({
            status: 'generating',
            training_completed_at: new Date().toISOString(),
          })
          .eq('id', generation.id)
          .select()
          .single();

        if (updateError || !updatedGeneration) {
          logger.error('Failed to update generation with existing LoRA', updateError?.message);
          return respond(c, failure(500, generationErrorCodes.trainingError, 'Failed to update generation'));
        }

        // Trigger Modal generation asynchronously
        triggerModalGeneration(
          supabase,
          generation.id,
          parsedBody.data.projectId,
          groomModel.loraModel.modelUrl,
          brideModel.loraModel.modelUrl,
          parsedBody.data.themeId || null,
          { endpoint: config.modal?.endpointUrl || process.env.MODAL_ENDPOINT_URL || '' }
        ).catch((error) => {
          logger.error('Modal generation failed', error);
        });

        return respond(c, success({
          ...generation,
          status: 'generating' as GenerationStatus,
          groomLoraUrl: groomModel.loraModel.modelUrl,
          brideLoraUrl: brideModel.loraModel.modelUrl,
          groomFalJobId: null,
          brideFalJobId: null,
        }, 201));
      }
    }

    // 3. No existing LoRA - Enqueue training job via QStash
    // In production: QStash handles the job asynchronously with retries
    // In development: Job runs synchronously for easier debugging
    try {
      const enqueueResult = await enqueueTrainingJob({
        generationId: generation.id,
        projectId: parsedBody.data.projectId,
        userId: user.id,
      });

      logger.info('Training job enqueued', {
        generationId: generation.id,
        messageId: enqueueResult.messageId,
      });

      // Return 202 Accepted - job is queued for processing
      return respond(c, success({
        ...generation,
        status: 'queued' as GenerationStatus,
      }, 202));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enqueue training job';
      logger.error('Failed to enqueue training job', errorMessage);

      // Update generation status to failed
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', generation.id);

      return respond(c, failure(500, generationErrorCodes.trainingError, errorMessage));
    }
  })

  // POST /generate/webhooks/fal - Fal.ai webhook handler
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
        failure(401, generationErrorCodes.webhookError, 'Invalid webhook signature')
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
      const parseError = parseResult as ErrorResult<string, unknown>;
      logger.error('Failed to parse Fal webhook payload', parseError.error.message);
      return respond(c, failure(400, 'INVALID_PAYLOAD', parseError.error.message));
    }

    const parsedPayload = parseResult.data;

    logger.info('Received Fal webhook for generation', {
      requestId: parsedPayload.requestId,
      status: parsedPayload.status,
    });

    // Handle COMPLETED status
    if (parsedPayload.status === 'COMPLETED' && parsedPayload.loraUrl) {
      const webhookResult = await handleFalWebhookForGeneration(
        supabase,
        parsedPayload.requestId,
        parsedPayload.loraUrl
      );

      if (!webhookResult.ok) {
        const webhookError = webhookResult as ErrorResult<string, unknown>;
        logger.error('Failed to handle Fal webhook', webhookError.error.message);
        return respond(c, failure(500, generationErrorCodes.webhookError, webhookError.error.message));
      }

      logger.info('LoRA training completed', {
        generationId: webhookResult.data.generationId,
        role: webhookResult.data.role,
        bothCompleted: webhookResult.data.bothCompleted,
      });

      // If both trainings are complete, trigger Modal generation
      if (webhookResult.data.bothCompleted) {
        logger.info('Both LoRA trainings complete, triggering Modal generation');

        // Get the generation to get theme_id
        const { data: generation } = await supabase
          .from('generations')
          .select('project_id, theme_id')
          .eq('id', webhookResult.data.generationId)
          .single();

        if (generation) {
          // Trigger Modal generation asynchronously (don't await)
          triggerModalGeneration(
            supabase,
            webhookResult.data.generationId,
            generation.project_id,
            webhookResult.data.groomLoraUrl!,
            webhookResult.data.brideLoraUrl!,
            generation.theme_id,
            { endpoint: config.modal?.endpointUrl || process.env.MODAL_ENDPOINT_URL || '' }
          ).catch((error) => {
            logger.error('Modal generation failed', error);
          });
        }
      }

      return respond(c, success({ received: true }));
    }

    // Handle FAILED status
    if (parsedPayload.status === 'FAILED') {
      // Find lora_model by fal_job_id
      const { data: loraModel } = await supabase
        .from('lora_models')
        .select('id, role')
        .eq('fal_job_id', parsedPayload.requestId)
        .single();

      if (loraModel) {
        // Update lora_model status to failed
        await supabase
          .from('lora_models')
          .update({ status: 'failed' })
          .eq('id', loraModel.id);

        // Find and update the generation via FK
        const fkColumn = loraModel.role === 'groom' ? 'groom_lora_model_id' : 'bride_lora_model_id';
        const { data: generation } = await supabase
          .from('generations')
          .select('id')
          .eq(fkColumn, loraModel.id)
          .single();

        if (generation) {
          await supabase
            .from('generations')
            .update({
              status: 'failed',
              error_message: parsedPayload.errorMessage || 'Training failed',
            })
            .eq('id', generation.id);

          logger.error('LoRA training failed', {
            generationId: generation.id,
            loraModelId: loraModel.id,
            error: parsedPayload.errorMessage,
          });
        }
      }

      return respond(c, success({ received: true }));
    }

    // For IN_PROGRESS and IN_QUEUE, just acknowledge
    return respond(c, success({ received: true }));
  })

  // POST /generate/:generationId/regenerate - Regenerate images using existing LoRA
  .post('/:generationId/regenerate', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const config = getConfig(c);

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

    // Get existing generation
    const result = await getGenerationById(
      supabase,
      parsedParams.data.generationId,
      user.id
    );

    if (!result.ok) {
      return respond(c, result);
    }

    const generation = result.data;

    // Check if both LoRA URLs exist
    if (!generation.groomLoraUrl || !generation.brideLoraUrl) {
      return respond(
        c,
        failure(400, 'LORA_NOT_READY', 'LoRA training must be completed before regenerating')
      );
    }

    // Reset generation status (preserve existing images)
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        status: 'generating',
        completed_at: null,
        error_message: null,
      })
      .eq('id', generation.id);

    if (updateError) {
      return respond(c, failure(500, generationErrorCodes.fetchError, updateError.message));
    }

    logger.info('Regenerating images', {
      generationId: generation.id,
      groomLoraUrl: generation.groomLoraUrl,
      brideLoraUrl: generation.brideLoraUrl,
    });

    // Trigger Modal generation (async)
    triggerModalGeneration(
      supabase,
      generation.id,
      generation.projectId,
      generation.groomLoraUrl,
      generation.brideLoraUrl,
      generation.themeId || null,
      { endpoint: config.modal?.endpointUrl || process.env.MODAL_ENDPOINT_URL || '' }
    ).catch((error) => {
      logger.error('Modal regeneration failed', error);
    });

    return respond(c, success({
      ...generation,
      status: 'generating' as GenerationStatus,
    }));
  })

  // GET /generate/project/:projectId - Get generation by project ID
  .get('/project/:projectId', async (c) => {
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

    const result = await getGenerationByProjectId(
      supabase,
      parsedParams.data.projectId,
      user.id
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<GenerationServiceError, unknown>;
      logger.error('Failed to fetch generation', errorResult.error.message);
      return respond(c, result);
    }

    // result.data can be null if generation doesn't exist yet
    // This is normal, not an error - responds with { ok: true, data: null }
    return respond(c, result);
  })

  // GET /generate/:generationId - Get generation status
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

    let generation = result.data;
    const config = getConfig(c);

    // Poll Fal.ai if status is training (handling local dev / webhook failure)
    if (generation.status === 'training' && !generation.trainingCompletedAt) {
      const falConfig = {
        apiKey: config.fal?.apiKey || process.env.FAL_KEY || '',
        webhookSecret: config.fal?.webhookSecret || process.env.FAL_WEBHOOK_SECRET || '',
        webhookUrl: '',
      };

      let updated = false;

      // Check Groom
      if (generation.groomFalJobId && !generation.groomLoraUrl) {
        const statusResult = await getTrainingStatus(falConfig, generation.groomFalJobId);
        if (statusResult.ok && statusResult.data.status === 'COMPLETED' && statusResult.data.loraUrl) {
          const webhookResult = await handleFalWebhookForGeneration(
            supabase,
            generation.groomFalJobId,
            statusResult.data.loraUrl
          );

          if (webhookResult.ok && webhookResult.data.bothCompleted) {
            triggerModalGeneration(
              supabase,
              webhookResult.data.generationId,
              generation.projectId,
              webhookResult.data.groomLoraUrl!,
              webhookResult.data.brideLoraUrl!,
              generation.themeId || null,
              { endpoint: config.modal?.endpointUrl || process.env.MODAL_ENDPOINT_URL || '' }
            ).catch((error) => {
              logger.error('Modal generation failed', error);
            });
          }
          updated = true;
        }
      }

      // Check Bride
      if (generation.brideFalJobId && !generation.brideLoraUrl) {
        const statusResult = await getTrainingStatus(falConfig, generation.brideFalJobId);
        if (statusResult.ok && statusResult.data.status === 'COMPLETED' && statusResult.data.loraUrl) {
          const webhookResult = await handleFalWebhookForGeneration(
            supabase,
            generation.brideFalJobId,
            statusResult.data.loraUrl
          );

          if (webhookResult.ok && webhookResult.data.bothCompleted) {
            triggerModalGeneration(
              supabase,
              webhookResult.data.generationId,
              generation.projectId,
              webhookResult.data.groomLoraUrl!,
              webhookResult.data.brideLoraUrl!,
              generation.themeId || null,
              { endpoint: config.modal?.endpointUrl || process.env.MODAL_ENDPOINT_URL || '' }
            ).catch((error) => {
              logger.error('Modal generation failed', error);
            });
          }
          updated = true;
        }
      }

      // If updated, fetch fresh data
      if (updated) {
        const freshResult = await getGenerationById(
          supabase,
          parsedParams.data.generationId,
          user.id
        );
        if (freshResult.ok) {
          generation = freshResult.data;
        }
      }
    }

    return respond(c, success(generation));
  });

// =============================================================================
// Legacy Registration (for backward compatibility with other routes)
// =============================================================================

export const registerGenerationRoutes = (app: Hono<AppEnv>) => {
  app.route('/generate', generationRoutes);
};
