import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createTrainingZip } from '@/backend/services/storage.service';
import { startLoraTraining, type FalClientConfig } from '@/backend/services/fal-client';
import { createLoraModel } from '@/backend/services/lora-model.service';
import type { FaceRole } from '@/features/face/types';
import type { ErrorResult } from '@/backend/http/response';

// =============================================================================
// Types
// =============================================================================

export interface TrainingJobPayload {
  generationId: string;
  projectId: string;
  userId: string;
}

export interface JobResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

// =============================================================================
// Supabase Admin Client
// =============================================================================

function createAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================================================
// handlePrepareTraining
// =============================================================================

/**
 * Core job handler for preparing training data.
 *
 * Flow:
 * 1. Check idempotency (only process if status is 'queued')
 * 2. Update status to 'preparing_training'
 * 3. Create ZIP files for groom and bride
 * 4. Start LoRA training via fal.ai
 * 5. Update status to 'training'
 */
export async function handlePrepareTraining(
  payload: TrainingJobPayload
): Promise<JobResult> {
  const { generationId, projectId } = payload;
  const supabase = createAdminClient();

  try {
    // 1. Idempotency check: only process if status is 'queued'
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('status, user_id')
      .eq('id', generationId)
      .single();

    if (fetchError) {
      console.error(`[Job] Database error:`, fetchError.message);
      return { success: false, error: fetchError.message };
    }

    if (!generation) {
      console.log(`[Job] Generation not found: ${generationId}`);
      return { success: true, skipped: true };
    }

    if (generation.status !== 'queued') {
      console.log(`[Job] Skipping: generation ${generationId} is ${generation.status}`);
      return { success: true, skipped: true };
    }

    const userId = generation.user_id;

    // 2. Update status to 'preparing_training'
    await supabase
      .from('generations')
      .update({ status: 'preparing_training' })
      .eq('id', generationId);

    console.log(`[Job] Status updated to preparing_training for ${generationId}`);

    // 3. Create ZIP files in parallel
    const [groomZipResult, brideZipResult] = await Promise.all([
      createTrainingZip(supabase, projectId, 'groom'),
      createTrainingZip(supabase, projectId, 'bride'),
    ]);

    if (!groomZipResult.ok) {
      const error = groomZipResult as ErrorResult<string, unknown>;
      await markAsFailed(supabase, generationId, error.error.message);
      return { success: false, error: error.error.message };
    }

    if (!brideZipResult.ok) {
      const error = brideZipResult as ErrorResult<string, unknown>;
      await markAsFailed(supabase, generationId, error.error.message);
      return { success: false, error: error.error.message };
    }

    console.log(`[Job] ZIP files created for ${generationId}`);

    // 4. Start fal.ai training
    const falConfig: FalClientConfig = {
      apiKey: process.env.FAL_KEY || '',
      webhookSecret: process.env.FAL_WEBHOOK_SECRET || '',
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/generate/webhooks/fal`,
    };

    const [groomTrainingResult, brideTrainingResult] = await Promise.all([
      startLoraTraining(falConfig, {
        imagesZipUrl: groomZipResult.data,
        role: 'groom',
        projectId,
      }),
      startLoraTraining(falConfig, {
        imagesZipUrl: brideZipResult.data,
        role: 'bride',
        projectId,
      }),
    ]);

    if (!groomTrainingResult.ok) {
      const error = groomTrainingResult as ErrorResult<string, unknown>;
      await markAsFailed(supabase, generationId, error.error.message);
      return { success: false, error: error.error.message };
    }

    if (!brideTrainingResult.ok) {
      const error = brideTrainingResult as ErrorResult<string, unknown>;
      await markAsFailed(supabase, generationId, error.error.message);
      return { success: false, error: error.error.message };
    }

    console.log(`[Job] LoRA training started for ${generationId}`);

    // 5. Create lora_models records
    const [groomLoraResult, brideLoraResult] = await Promise.all([
      createLoraModel(
        supabase,
        projectId,
        userId,
        'groom' as FaceRole,
        groomTrainingResult.data.requestId,
        'training'
      ),
      createLoraModel(
        supabase,
        projectId,
        userId,
        'bride' as FaceRole,
        brideTrainingResult.data.requestId,
        'training'
      ),
    ]);

    if (!groomLoraResult.ok || !brideLoraResult.ok) {
      const error = (!groomLoraResult.ok ? groomLoraResult : brideLoraResult) as ErrorResult<string, unknown>;
      await markAsFailed(supabase, generationId, error.error.message);
      return { success: false, error: error.error.message };
    }

    // 6. Update generation with FK references and status
    await supabase
      .from('generations')
      .update({
        status: 'training',
        groom_lora_model_id: groomLoraResult.data.id,
        bride_lora_model_id: brideLoraResult.data.id,
        started_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    console.log(`[Job] Status updated to training for ${generationId}`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Job] Unexpected error:`, message);

    try {
      await markAsFailed(supabase, generationId, message);
    } catch {
      // Ignore failure to mark as failed
    }

    return { success: false, error: message };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

async function markAsFailed(
  supabase: SupabaseClient,
  generationId: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from('generations')
    .update({
      status: 'failed',
      error_message: errorMessage,
    })
    .eq('id', generationId);
}
