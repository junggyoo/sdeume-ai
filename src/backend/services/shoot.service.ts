import type { SupabaseClient } from '@supabase/supabase-js';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import type {
  ShootJob,
  ShootJobRow,
  ShootJobStatus,
  ShootStatusResponse,
  StartShootRequest,
  ShootErrorCode,
} from '@/features/shooting/types';
import { POLLING_INTERVALS, SHOOT_ERROR_CODES } from '@/features/shooting/types';

// =============================================================================
// Row Mapper
// =============================================================================

export const mapRowToShootJob = (row: ShootJobRow): ShootJob => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  themeId: row.theme_id,
  status: row.status as ShootJobStatus,

  groomFalJobId: row.groom_fal_job_id,
  groomLoraUrl: row.groom_lora_url,
  brideFalJobId: row.bride_fal_job_id,
  brideLoraUrl: row.bride_lora_url,

  trainingStartedAt: row.training_started_at,
  trainingCompletedAt: row.training_completed_at,

  modalJobId: row.modal_job_id,
  generationStartedAt: row.generation_started_at,
  generationCompletedAt: row.generation_completed_at,
  generationParams: row.generation_params || {},

  images: row.images || [],

  errorCode: row.error_code,
  errorMessage: row.error_message,
  retryCount: row.retry_count || 0,

  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// =============================================================================
// Polling Interval
// =============================================================================

export const getRecommendedPollingInterval = (status: ShootJobStatus): number => {
  return POLLING_INTERVALS[status];
};

// =============================================================================
// Create Shoot Job
// =============================================================================

export const createShootJob = async (
  supabase: SupabaseClient,
  userId: string,
  input: StartShootRequest
): Promise<HandlerResult<ShootJob, ShootErrorCode>> => {
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
      SHOOT_ERROR_CODES.INVALID_PROJECT,
      'Project not found or not owned by user'
    );
  }

  // Verify theme exists
  const { data: theme, error: themeError } = await supabase
    .from('themes')
    .select('id')
    .eq('id', input.themeId)
    .single();

  if (themeError || !theme) {
    return failure(
      404,
      SHOOT_ERROR_CODES.INVALID_THEME,
      'Theme not found'
    );
  }

  // Create shoot job
  const { data, error } = await supabase
    .from('shoot_jobs')
    .insert({
      project_id: input.projectId,
      user_id: userId,
      theme_id: input.themeId,
      status: 'training_queued',
      training_started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return failure(500, SHOOT_ERROR_CODES.FETCH_ERROR, error.message);
  }

  return success(mapRowToShootJob(data), 201);
};

// =============================================================================
// Get Shoot Job By ID
// =============================================================================

export const getShootJobById = async (
  supabase: SupabaseClient,
  jobId: string,
  userId: string
): Promise<HandlerResult<ShootStatusResponse, ShootErrorCode>> => {
  const { data, error } = await supabase
    .from('shoot_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, SHOOT_ERROR_CODES.JOB_NOT_FOUND, 'Shoot job not found');
    }
    return failure(500, SHOOT_ERROR_CODES.FETCH_ERROR, error.message);
  }

  const job = mapRowToShootJob(data);

  return success({
    job,
    recommendedIntervalSec: getRecommendedPollingInterval(job.status),
  });
};

// =============================================================================
// Update Shoot Job Status
// =============================================================================

interface UpdateStatusOptions {
  errorCode?: string;
  errorMessage?: string;
  groomFalJobId?: string;
  brideFalJobId?: string;
  groomLoraUrl?: string;
  brideLoraUrl?: string;
  modalJobId?: string;
  trainingCompletedAt?: string;
  generationStartedAt?: string;
  generationCompletedAt?: string;
}

export const updateShootJobStatus = async (
  supabase: SupabaseClient,
  jobId: string,
  status: ShootJobStatus,
  options?: UpdateStatusOptions
): Promise<HandlerResult<ShootJob, ShootErrorCode>> => {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (options?.errorCode) {
    updateData.error_code = options.errorCode;
  }
  if (options?.errorMessage) {
    updateData.error_message = options.errorMessage;
  }
  if (options?.groomFalJobId) {
    updateData.groom_fal_job_id = options.groomFalJobId;
  }
  if (options?.brideFalJobId) {
    updateData.bride_fal_job_id = options.brideFalJobId;
  }
  if (options?.groomLoraUrl) {
    updateData.groom_lora_url = options.groomLoraUrl;
  }
  if (options?.brideLoraUrl) {
    updateData.bride_lora_url = options.brideLoraUrl;
  }
  if (options?.modalJobId) {
    updateData.modal_job_id = options.modalJobId;
  }
  if (options?.trainingCompletedAt) {
    updateData.training_completed_at = options.trainingCompletedAt;
  }
  if (options?.generationStartedAt) {
    updateData.generation_started_at = options.generationStartedAt;
  }
  if (options?.generationCompletedAt) {
    updateData.generation_completed_at = options.generationCompletedAt;
  }

  const { data, error } = await supabase
    .from('shoot_jobs')
    .update(updateData)
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    return failure(500, SHOOT_ERROR_CODES.UPDATE_ERROR, error.message);
  }

  return success(mapRowToShootJob(data));
};

// =============================================================================
// Handle Fal Webhook Completion
// =============================================================================

export const handleFalWebhookCompletion = async (
  supabase: SupabaseClient,
  falJobId: string,
  loraUrl: string
): Promise<HandlerResult<ShootJob, ShootErrorCode>> => {
  // Find job by fal job ID (could be groom or bride)
  const { data: groomJob } = await supabase
    .from('shoot_jobs')
    .select('*')
    .eq('groom_fal_job_id', falJobId)
    .single();

  const { data: brideJob } = await supabase
    .from('shoot_jobs')
    .select('*')
    .eq('bride_fal_job_id', falJobId)
    .single();

  const job = groomJob || brideJob;

  if (!job) {
    return failure(
      404,
      SHOOT_ERROR_CODES.WEBHOOK_JOB_NOT_FOUND,
      `No shoot job found for Fal job ID: ${falJobId}`
    );
  }

  const isGroom = groomJob !== null;
  const currentRow = job as ShootJobRow;

  // Determine what to update
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (isGroom) {
    updateData.groom_lora_url = loraUrl;
  } else {
    updateData.bride_lora_url = loraUrl;
  }

  // Check if both LoRAs are now complete
  const groomComplete = isGroom ? true : !!currentRow.groom_lora_url;
  const brideComplete = isGroom ? !!currentRow.bride_lora_url : true;

  if (groomComplete && brideComplete) {
    // Both complete - transition to standby
    updateData.status = 'standby';
    updateData.training_completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('shoot_jobs')
    .update(updateData)
    .eq('id', currentRow.id)
    .select()
    .single();

  if (error) {
    return failure(500, SHOOT_ERROR_CODES.UPDATE_ERROR, error.message);
  }

  return success(mapRowToShootJob(data));
};

// =============================================================================
// Handle Fal Webhook Failure
// =============================================================================

export const handleFalWebhookFailure = async (
  supabase: SupabaseClient,
  falJobId: string,
  errorMessage: string,
  errorCode?: string
): Promise<HandlerResult<ShootJob, ShootErrorCode>> => {
  // Find job by fal job ID
  const { data: groomJob } = await supabase
    .from('shoot_jobs')
    .select('*')
    .eq('groom_fal_job_id', falJobId)
    .single();

  const { data: brideJob } = await supabase
    .from('shoot_jobs')
    .select('*')
    .eq('bride_fal_job_id', falJobId)
    .single();

  const job = groomJob || brideJob;

  if (!job) {
    return failure(
      404,
      SHOOT_ERROR_CODES.WEBHOOK_JOB_NOT_FOUND,
      `No shoot job found for Fal job ID: ${falJobId}`
    );
  }

  return updateShootJobStatus(supabase, job.id, 'failed', {
    errorCode: errorCode || SHOOT_ERROR_CODES.FAL_TRAINING_ERROR,
    errorMessage,
  });
};

// =============================================================================
// Update Job with Fal Job IDs
// =============================================================================

export const updateJobWithFalJobIds = async (
  supabase: SupabaseClient,
  jobId: string,
  groomFalJobId: string,
  brideFalJobId: string
): Promise<HandlerResult<ShootJob, ShootErrorCode>> => {
  return updateShootJobStatus(supabase, jobId, 'training', {
    groomFalJobId,
    brideFalJobId,
  });
};

// =============================================================================
// Update Job with Modal Generation
// =============================================================================

export const startModalGeneration = async (
  supabase: SupabaseClient,
  jobId: string,
  modalJobId?: string
): Promise<HandlerResult<ShootJob, ShootErrorCode>> => {
  return updateShootJobStatus(supabase, jobId, 'generating', {
    modalJobId,
    generationStartedAt: new Date().toISOString(),
  });
};

// =============================================================================
// Complete Generation
// =============================================================================

export const completeGeneration = async (
  supabase: SupabaseClient,
  jobId: string,
  images: Array<{ url: string; blurUrl: string; thumbnailUrl: string }>
): Promise<HandlerResult<ShootJob, ShootErrorCode>> => {
  const { data, error } = await supabase
    .from('shoot_jobs')
    .update({
      status: 'complete',
      images,
      generation_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    return failure(500, SHOOT_ERROR_CODES.UPDATE_ERROR, error.message);
  }

  return success(mapRowToShootJob(data));
};

// =============================================================================
// Increment Retry Count
// =============================================================================

export const incrementRetryCount = async (
  supabase: SupabaseClient,
  jobId: string
): Promise<HandlerResult<ShootJob, ShootErrorCode>> => {
  const { data: current } = await supabase
    .from('shoot_jobs')
    .select('retry_count')
    .eq('id', jobId)
    .single();

  const newRetryCount = (current?.retry_count || 0) + 1;

  const { data, error } = await supabase
    .from('shoot_jobs')
    .update({
      retry_count: newRetryCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    return failure(500, SHOOT_ERROR_CODES.UPDATE_ERROR, error.message);
  }

  return success(mapRowToShootJob(data));
};
