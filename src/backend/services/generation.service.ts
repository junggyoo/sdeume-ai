import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  type HandlerResult,
  type ErrorResult,
} from '@/backend/http/response';
import { createTrainingZip, uploadGeneratedImage } from './storage.service';
import { startLoraTraining, type FalClientConfig } from './fal-client';
import { generateImages, type ModalClientConfig } from './modal-client';
import type { GenerationImage, GenerationStatus } from '@/features/generation/types';

// =============================================================================
// Types
// =============================================================================

export interface GenerationWithLoRA {
  id: string;
  status: GenerationStatus;
  groomFalJobId: string | null;
  brideFalJobId: string | null;
  groomLoraUrl: string | null;
  brideLoraUrl: string | null;
  trainingCompletedAt: string | null;
  images: GenerationImage[];
}

export interface WebhookResult {
  generationId: string;
  role: 'groom' | 'bride';
  loraUrl: string;
  groomLoraUrl: string | null;
  brideLoraUrl: string | null;
  bothCompleted: boolean;
}

// =============================================================================
// Error Codes
// =============================================================================

const generationServiceErrorCodes = {
  notFound: 'GENERATION_NOT_FOUND',
  noImagesFound: 'NO_IMAGES_FOUND',
  falError: 'FAL_ERROR',
  modalError: 'MODAL_ERROR',
  databaseError: 'DATABASE_ERROR',
} as const;

type GenerationServiceErrorCode =
  (typeof generationServiceErrorCodes)[keyof typeof generationServiceErrorCodes];

// =============================================================================
// startLoraTrainingForGeneration
// =============================================================================

export const startLoraTrainingForGeneration = async (
  supabase: SupabaseClient,
  generationId: string,
  projectId: string,
  falConfig: FalClientConfig
): Promise<HandlerResult<GenerationWithLoRA, GenerationServiceErrorCode>> => {
  // 1. Create ZIP files for both groom and bride in parallel
  const [groomZipResult, brideZipResult] = await Promise.all([
    createTrainingZip(supabase, projectId, 'groom'),
    createTrainingZip(supabase, projectId, 'bride'),
  ]);

  // Check ZIP creation results
  if (!groomZipResult.ok) {
    const groomZipError = groomZipResult as ErrorResult<string, unknown>;
    return failure(
      groomZipError.status,
      groomZipError.error.code as GenerationServiceErrorCode,
      groomZipError.error.message
    );
  }

  if (!brideZipResult.ok) {
    const brideZipError = brideZipResult as ErrorResult<string, unknown>;
    return failure(
      brideZipError.status,
      brideZipError.error.code as GenerationServiceErrorCode,
      brideZipError.error.message
    );
  }

  // 2. Start Fal.ai training for both in parallel
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

  // Check training start results
  if (!groomTrainingResult.ok) {
    const groomTrainingError = groomTrainingResult as ErrorResult<string, unknown>;
    return failure(
      groomTrainingError.status,
      generationServiceErrorCodes.falError,
      groomTrainingError.error.message
    );
  }

  if (!brideTrainingResult.ok) {
    const brideTrainingError = brideTrainingResult as ErrorResult<string, unknown>;
    return failure(
      brideTrainingError.status,
      generationServiceErrorCodes.falError,
      brideTrainingError.error.message
    );
  }

  // 3. Update generation with Fal job IDs and status
  const { data, error } = await supabase
    .from('generations')
    .update({
      status: 'training',
      groom_fal_job_id: groomTrainingResult.data.requestId,
      bride_fal_job_id: brideTrainingResult.data.requestId,
      started_at: new Date().toISOString(),
    })
    .eq('id', generationId)
    .select()
    .single();

  if (error || !data) {
    return failure(500, generationServiceErrorCodes.databaseError, error?.message || 'Failed to update generation');
  }

  return success({
    id: data.id,
    status: 'training' as GenerationStatus,
    groomFalJobId: groomTrainingResult.data.requestId,
    brideFalJobId: brideTrainingResult.data.requestId,
    groomLoraUrl: null,
    brideLoraUrl: null,
    trainingCompletedAt: null,
    images: [],
  });
};

// =============================================================================
// handleFalWebhookForGeneration
// =============================================================================

export const handleFalWebhookForGeneration = async (
  supabase: SupabaseClient,
  falJobId: string,
  loraUrl: string
): Promise<HandlerResult<WebhookResult, GenerationServiceErrorCode>> => {
  // Find generation by Fal job ID (check both groom and bride columns)
  const { data: groomMatch, error: groomError } = await supabase
    .from('generations')
    .select('*')
    .eq('groom_fal_job_id', falJobId)
    .single();

  const { data: brideMatch, error: brideError } = await supabase
    .from('generations')
    .select('*')
    .eq('bride_fal_job_id', falJobId)
    .single();

  const generation = groomMatch || brideMatch;
  const role: 'groom' | 'bride' = groomMatch ? 'groom' : 'bride';

  if (!generation) {
    // Both queries returned no results
    if (groomError?.code === 'PGRST116' && brideError?.code === 'PGRST116') {
      return failure(404, generationServiceErrorCodes.notFound, 'Generation not found for Fal job ID');
    }
    return failure(500, generationServiceErrorCodes.databaseError, 'Database query failed');
  }

  // Determine which LoRA URL to update
  const updateField = role === 'groom' ? 'groom_lora_url' : 'bride_lora_url';

  // Check if this completes both trainings
  const otherLoraUrl = role === 'groom' ? generation.bride_lora_url : generation.groom_lora_url;
  const bothCompleted = !!otherLoraUrl;

  // Update with LoRA URL
  const updateData: Record<string, unknown> = {
    [updateField]: loraUrl,
  };

  // If both are completed, set training_completed_at
  if (bothCompleted) {
    updateData.training_completed_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from('generations')
    .update(updateData)
    .eq('id', generation.id)
    .select()
    .single();

  if (updateError || !updated) {
    return failure(500, generationServiceErrorCodes.databaseError, updateError?.message || 'Failed to update generation');
  }

  return success({
    generationId: generation.id,
    role,
    loraUrl,
    groomLoraUrl: role === 'groom' ? loraUrl : (generation.groom_lora_url as string | null),
    brideLoraUrl: role === 'bride' ? loraUrl : (generation.bride_lora_url as string | null),
    bothCompleted,
  });
};

// =============================================================================
// triggerModalGeneration
// =============================================================================

export const triggerModalGeneration = async (
  supabase: SupabaseClient,
  generationId: string,
  projectId: string,
  groomLoraUrl: string,
  brideLoraUrl: string,
  themeId: string | null,
  modalConfig: { endpoint: string }
): Promise<HandlerResult<{ status: GenerationStatus; images: GenerationImage[] }, GenerationServiceErrorCode>> => {
  // 1. Update status to 'generating'
  await supabase
    .from('generations')
    .update({ status: 'generating' })
    .eq('id', generationId);

  // 2. Get theme prompt if available
  let prompt = 'Generate a beautiful wedding photo with the couple';
  if (themeId) {
    const { data: theme } = await supabase
      .from('themes')
      .select('prompt')
      .eq('id', themeId)
      .single();

    if (theme?.prompt) {
      prompt = theme.prompt;
    }
  }

  // 3. Call Modal API
  const modalClientConfig: ModalClientConfig = {
    endpointUrl: modalConfig.endpoint,
    timeoutMs: 300000, // 5 minutes timeout for image generation
  };

  const modalResult = await generateImages(modalClientConfig, {
    groomLoraUrl,
    brideLoraUrl,
    prompt,
  });

  if (!modalResult.ok) {
    const modalError = modalResult as ErrorResult<string, unknown>;
    // Update status to failed
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: modalError.error.message,
      })
      .eq('id', generationId);

    return failure(500, generationServiceErrorCodes.modalError, modalError.error.message);
  }

  // 4. Process and upload images
  const generatedImages: GenerationImage[] = [];

  for (let i = 0; i < modalResult.data.images.length; i++) {
    const image = modalResult.data.images[i];

    const uploadResult = await uploadGeneratedImage(
      supabase,
      projectId,
      generationId,
      i,
      `data:image/png;base64,${image.base64}`
    );

    if (uploadResult.ok) {
      generatedImages.push({
        url: uploadResult.data.originalUrl,
        is_blur: false,
        thumbnail_url: uploadResult.data.thumbnailUrl,
        blur_hash: uploadResult.data.blurHash,
      });

      // Update images array incrementally in database
      await supabase
        .from('generations')
        .update({ images: generatedImages })
        .eq('id', generationId);
    }
  }

  // 5. Update final status
  const { data: finalGeneration, error: finalError } = await supabase
    .from('generations')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      images: generatedImages,
    })
    .eq('id', generationId)
    .select()
    .single();

  if (finalError || !finalGeneration) {
    return failure(500, generationServiceErrorCodes.databaseError, 'Failed to update final generation status');
  }

  return success({
    status: 'completed' as GenerationStatus,
    images: generatedImages,
  });
};
