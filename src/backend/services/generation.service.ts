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
import { createLoraModel, getLoraModelByFalJobId, updateLoraModelStatus } from './lora-model.service';
import { upsertUserFaceModel } from './user-face-model.service';
import type { GenerationImage, GenerationStatus } from '@/features/generation/types';
import type { FaceRole } from '@/features/face/types';

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
  groomLoraModelId: string | null;
  brideLoraModelId: string | null;
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
  loraModelNotFound: 'LORA_MODEL_NOT_FOUND',
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
  // 0. Get generation to retrieve user_id
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .select('user_id')
    .eq('id', generationId)
    .single();

  if (genError || !generation) {
    return failure(404, generationServiceErrorCodes.notFound, 'Generation not found');
  }

  const userId = generation.user_id;

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

  // 3. Create lora_models records for both roles
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

  if (!groomLoraResult.ok) {
    const groomLoraError = groomLoraResult as ErrorResult<string, unknown>;
    return failure(500, generationServiceErrorCodes.databaseError, groomLoraError.error.message);
  }

  if (!brideLoraResult.ok) {
    const brideLoraError = brideLoraResult as ErrorResult<string, unknown>;
    return failure(500, generationServiceErrorCodes.databaseError, brideLoraError.error.message);
  }

  // 4. Update generation with FK references
  const { data, error } = await supabase
    .from('generations')
    .update({
      status: 'training',
      groom_lora_model_id: groomLoraResult.data.id,
      bride_lora_model_id: brideLoraResult.data.id,
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
    groomLoraModelId: groomLoraResult.data.id,
    brideLoraModelId: brideLoraResult.data.id,
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
  // 1. Find lora_model by fal_job_id
  const loraModelResult = await getLoraModelByFalJobId(supabase, falJobId);

  if (!loraModelResult.ok) {
    return failure(500, generationServiceErrorCodes.databaseError, 'Failed to query lora_models');
  }

  const loraModel = loraModelResult.data;

  if (!loraModel) {
    return failure(404, generationServiceErrorCodes.loraModelNotFound, 'LoRA model not found for Fal job ID');
  }

  const role = loraModel.role as 'groom' | 'bride';
  const userId = loraModel.userId;

  // 2. Update lora_model status to completed with model_url
  const updateResult = await updateLoraModelStatus(supabase, loraModel.id, 'completed', loraUrl);

  if (!updateResult.ok) {
    return failure(500, generationServiceErrorCodes.databaseError, 'Failed to update lora_model');
  }

  // 3. Upsert user_face_model to link the completed lora_model
  await upsertUserFaceModel(supabase, userId, role as FaceRole, loraModel.id);

  // 4. Find generation by lora_model_id FK
  const fkColumn = role === 'groom' ? 'groom_lora_model_id' : 'bride_lora_model_id';

  const { data: generation, error: genError } = await supabase
    .from('generations')
    .select(`
      id,
      user_id,
      groom_lora_model_id,
      bride_lora_model_id,
      groom_lora:lora_models!groom_lora_model_id(model_url),
      bride_lora:lora_models!bride_lora_model_id(model_url)
    `)
    .eq(fkColumn, loraModel.id)
    .single();

  if (genError || !generation) {
    // Generation not found - this might happen if the lora_model was created
    // but generation link failed. Return error for proper handling.
    if (genError?.code === 'PGRST116') {
      return failure(404, generationServiceErrorCodes.notFound, 'Generation not found for lora_model');
    }
    return failure(500, generationServiceErrorCodes.databaseError, genError?.message || 'Database query failed');
  }

  // 5. Determine lora URLs from joined data
  // Supabase FK JOIN (many-to-one) returns a single object, not an array
  const groomLoraData = generation.groom_lora as { model_url: string | null } | null;
  const brideLoraData = generation.bride_lora as { model_url: string | null } | null;

  const groomLoraUrl = groomLoraData?.model_url || null;
  const brideLoraUrl = brideLoraData?.model_url || null;

  // 6. Check if both trainings are completed
  const bothCompleted = !!(groomLoraUrl && brideLoraUrl);

  // 7. Update training_completed_at AND status if both trainings are done
  if (bothCompleted) {
    await supabase
      .from('generations')
      .update({
        training_completed_at: new Date().toISOString(),
        status: 'generating',
      })
      .eq('id', generation.id);
  }

  return success({
    generationId: generation.id,
    role,
    loraUrl,
    groomLoraUrl: role === 'groom' ? loraUrl : groomLoraUrl,
    brideLoraUrl: role === 'bride' ? loraUrl : brideLoraUrl,
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
  // 1. Fetch existing generation to preserve existing images
  const { data: existingGeneration } = await supabase
    .from('generations')
    .select('images')
    .eq('id', generationId)
    .single();

  const existingImages: GenerationImage[] = existingGeneration?.images || [];

  // 2. Update status to 'generating'
  await supabase
    .from('generations')
    .update({ status: 'generating' })
    .eq('id', generationId);

  // 3. Get theme prompt if available
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

  // 4. Call Modal API
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

  // 5. Process and upload images (preserve existing images)
  const generatedImages: GenerationImage[] = [...existingImages];
  const startIndex = existingImages.length; // Start from existing image count to avoid overwriting

  for (let i = 0; i < modalResult.data.images.length; i++) {
    const image = modalResult.data.images[i];

    const uploadResult = await uploadGeneratedImage(
      supabase,
      projectId,
      generationId,
      startIndex + i, // Use offset to prevent overwriting existing images
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

  // 6. Update final status
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
