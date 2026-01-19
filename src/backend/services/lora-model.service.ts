import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import type { FaceRole } from '@/features/face/types';

// =============================================================================
// Types
// =============================================================================

export type LoraModelStatus = 'pending' | 'training' | 'completed' | 'failed';

export interface LoraModel {
  id: string;
  projectId: string;
  userId: string;
  role: FaceRole;
  falJobId: string | null;
  modelUrl: string | null;
  status: LoraModelStatus;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface LoraModelRow {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  fal_job_id: string | null;
  model_url: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

// =============================================================================
// Error Codes
// =============================================================================

const errorCodes = {
  createError: 'LORA_MODEL_CREATE_ERROR',
  fetchError: 'LORA_MODEL_FETCH_ERROR',
  updateError: 'LORA_MODEL_UPDATE_ERROR',
  notFound: 'LORA_MODEL_NOT_FOUND',
} as const;

type LoraModelError = (typeof errorCodes)[keyof typeof errorCodes];

// =============================================================================
// Helpers
// =============================================================================

const mapRowToLoraModel = (row: LoraModelRow): LoraModel => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  role: row.role as FaceRole,
  falJobId: row.fal_job_id,
  modelUrl: row.model_url,
  status: row.status as LoraModelStatus,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  errorMessage: row.error_message,
  createdAt: row.created_at,
});

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Create a new LoRA model record
 */
export async function createLoraModel(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  role: FaceRole,
  falJobId: string,
  initialStatus: LoraModelStatus = 'pending'
): Promise<HandlerResult<LoraModel, LoraModelError>> {
  const insertData: Record<string, unknown> = {
    project_id: projectId,
    user_id: userId,
    role,
    fal_job_id: falJobId,
    status: initialStatus,
  };

  if (initialStatus === 'training') {
    insertData.started_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('lora_models')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    return failure(500, errorCodes.createError, error?.message || 'Failed to create LoRA model');
  }

  return success(mapRowToLoraModel(data as LoraModelRow));
}

/**
 * Get a LoRA model by its Fal.ai job ID
 */
export async function getLoraModelByFalJobId(
  supabase: SupabaseClient,
  falJobId: string
): Promise<HandlerResult<LoraModel | null, LoraModelError>> {
  const { data, error } = await supabase
    .from('lora_models')
    .select('*')
    .eq('fal_job_id', falJobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return success(null);
    }
    return failure(500, errorCodes.fetchError, error.message);
  }

  return success(mapRowToLoraModel(data as LoraModelRow));
}

/**
 * Get a LoRA model by its ID
 */
export async function getLoraModelById(
  supabase: SupabaseClient,
  loraModelId: string
): Promise<HandlerResult<LoraModel | null, LoraModelError>> {
  const { data, error } = await supabase
    .from('lora_models')
    .select('*')
    .eq('id', loraModelId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return success(null);
    }
    return failure(500, errorCodes.fetchError, error.message);
  }

  return success(mapRowToLoraModel(data as LoraModelRow));
}

/**
 * Get all LoRA models for a project
 */
export async function getLoraModelsByProjectId(
  supabase: SupabaseClient,
  projectId: string
): Promise<HandlerResult<LoraModel[], LoraModelError>> {
  const { data, error } = await supabase
    .from('lora_models')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    return failure(500, errorCodes.fetchError, error.message);
  }

  const models = (data || []).map((row) => mapRowToLoraModel(row as LoraModelRow));
  return success(models);
}

/**
 * Update a LoRA model's status
 */
export async function updateLoraModelStatus(
  supabase: SupabaseClient,
  loraModelId: string,
  status: LoraModelStatus,
  modelUrl?: string,
  errorMessage?: string
): Promise<HandlerResult<LoraModel, LoraModelError>> {
  const updateData: Record<string, unknown> = { status };

  if (status === 'training') {
    updateData.started_at = new Date().toISOString();
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    if (modelUrl) {
      updateData.model_url = modelUrl;
    }
  }

  if (status === 'failed' && errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { data, error } = await supabase
    .from('lora_models')
    .update(updateData)
    .eq('id', loraModelId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, errorCodes.notFound, 'LoRA model not found');
    }
    return failure(500, errorCodes.updateError, error.message);
  }

  if (!data) {
    return failure(404, errorCodes.notFound, 'LoRA model not found');
  }

  return success(mapRowToLoraModel(data as LoraModelRow));
}
