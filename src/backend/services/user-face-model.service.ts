import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import type {
  FaceRole,
  UserFaceModel,
  UserFaceModelRow,
} from '@/features/face/types';
import { mapUserFaceModelFromRow } from '@/features/face/types';

// =============================================================================
// Error Codes
// =============================================================================

const errorCodes = {
  fetchError: 'FACE_MODEL_FETCH_ERROR',
  upsertError: 'FACE_MODEL_UPSERT_ERROR',
  notFound: 'FACE_MODEL_NOT_FOUND',
} as const;

type UserFaceModelError = (typeof errorCodes)[keyof typeof errorCodes];

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get all active face models for a user
 */
export async function getUserActiveFaceModels(
  supabase: SupabaseClient,
  userId: string
): Promise<HandlerResult<UserFaceModel[], UserFaceModelError>> {
  const { data, error } = await supabase
    .from('user_face_models')
    .select(
      `
      *,
      lora_model:lora_models(id, model_url, status, completed_at)
    `
    )
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    return failure(500, errorCodes.fetchError, error.message);
  }

  const models = (data || []).map((row) =>
    mapUserFaceModelFromRow(row as UserFaceModelRow)
  );

  return success(models);
}

/**
 * Get a specific active face model by user and role
 */
export async function getUserFaceModelByRole(
  supabase: SupabaseClient,
  userId: string,
  role: FaceRole
): Promise<HandlerResult<UserFaceModel | null, UserFaceModelError>> {
  const { data, error } = await supabase
    .from('user_face_models')
    .select(
      `
      *,
      lora_model:lora_models(id, model_url, status, completed_at)
    `
    )
    .eq('user_id', userId)
    .eq('role', role)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return success(null);
    }
    return failure(500, errorCodes.fetchError, error.message);
  }

  return success(mapUserFaceModelFromRow(data as UserFaceModelRow));
}

/**
 * Upsert a user face model (deactivate existing, create new active)
 */
export async function upsertUserFaceModel(
  supabase: SupabaseClient,
  userId: string,
  role: FaceRole,
  loraModelId: string
): Promise<HandlerResult<UserFaceModel, UserFaceModelError>> {
  // 1. Deactivate existing active models for this user+role
  const { error: deactivateError } = await supabase
    .from('user_face_models')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('role', role)
    .eq('is_active', true);

  if (deactivateError) {
    return failure(500, errorCodes.upsertError, deactivateError.message);
  }

  // 2. Insert new active model
  const { data, error: insertError } = await supabase
    .from('user_face_models')
    .insert({
      user_id: userId,
      role,
      lora_model_id: loraModelId,
      is_active: true,
    })
    .select(
      `
      *,
      lora_model:lora_models(id, model_url, status, completed_at)
    `
    )
    .single();

  if (insertError) {
    return failure(500, errorCodes.upsertError, insertError.message);
  }

  return success(mapUserFaceModelFromRow(data as UserFaceModelRow));
}

/**
 * Deactivate a user face model
 */
export async function deactivateUserFaceModel(
  supabase: SupabaseClient,
  userId: string,
  modelId: string
): Promise<HandlerResult<void, UserFaceModelError>> {
  const { error } = await supabase
    .from('user_face_models')
    .update({ is_active: false })
    .eq('id', modelId)
    .eq('user_id', userId);

  if (error) {
    return failure(500, errorCodes.upsertError, error.message);
  }

  return success(undefined);
}
