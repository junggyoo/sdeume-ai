// =============================================================================
// Shoot Job Status (State Machine)
// =============================================================================

/**
 * State machine: training_queued → training → standby → generating → complete | failed
 */
export type ShootJobStatus =
  | 'training_queued'
  | 'training'
  | 'standby'
  | 'generating'
  | 'complete'
  | 'failed';

// =============================================================================
// Shoot Job Image
// =============================================================================

export interface ShootJobImage {
  url: string;
  blurUrl: string;
  thumbnailUrl: string;
}

// =============================================================================
// Shoot Job Entity
// =============================================================================

export interface ShootJob {
  id: string;
  projectId: string;
  userId: string;
  themeId: string;
  status: ShootJobStatus;

  // Fal.ai LoRA (Groom)
  groomFalJobId: string | null;
  groomLoraUrl: string | null;

  // Fal.ai LoRA (Bride)
  brideFalJobId: string | null;
  brideLoraUrl: string | null;

  // Training timestamps
  trainingStartedAt: string | null;
  trainingCompletedAt: string | null;

  // Modal generation
  modalJobId: string | null;
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  generationParams: Record<string, unknown>;

  // Generated images
  images: ShootJobImage[];

  // Error handling
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Database Row Type (snake_case)
// =============================================================================

export interface ShootJobRow {
  id: string;
  project_id: string;
  user_id: string;
  theme_id: string;
  status: string;

  // Fal.ai LoRA (Groom)
  groom_fal_job_id: string | null;
  groom_lora_url: string | null;

  // Fal.ai LoRA (Bride)
  bride_fal_job_id: string | null;
  bride_lora_url: string | null;

  // Training timestamps
  training_started_at: string | null;
  training_completed_at: string | null;

  // Modal generation
  modal_job_id: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  generation_params: Record<string, unknown> | null;

  // Generated images
  images: ShootJobImage[] | null;

  // Error handling
  error_code: string | null;
  error_message: string | null;
  retry_count: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =============================================================================
// API Request Types
// =============================================================================

export interface StartShootRequest {
  projectId: string;
  themeId: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Adaptive polling intervals based on status
 */
export const POLLING_INTERVALS: Record<ShootJobStatus, number> = {
  training_queued: 5, // 5초
  training: 10, // 10초 (장시간 대기)
  standby: 2, // 2초 (빠른 전이)
  generating: 2, // 2초 (실시간 드롭)
  complete: 0, // 폴링 중단
  failed: 0, // 폴링 중단
};

export interface ShootStatusResponse {
  job: ShootJob;
  recommendedIntervalSec: number;
}

// =============================================================================
// Fal.ai Types
// =============================================================================

export interface FalTrainingInput {
  images_data_url: string; // ZIP file URL containing training images
  trigger_word: string; // e.g., "GROOM_SDME" or "BRIDE_SDME"
  is_style: boolean;
  steps: number;
  create_masks: boolean;
}

export interface FalTrainingResponse {
  request_id: string;
}

export type FalWebhookStatus = 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'IN_QUEUE';

export interface FalWebhookPayload {
  request_id: string;
  status: FalWebhookStatus;
  output?: {
    diffusers_lora_file: {
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
    };
    config_file: {
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
    };
  };
  error?: {
    message: string;
    code?: string;
  };
  metrics?: {
    inference_time: number;
  };
}

// =============================================================================
// Modal Types
// =============================================================================

export interface ModalGenerateRequest {
  prompt?: string;
  groomLoraUrl: string;
  brideLoraUrl: string;
}

export interface ModalGeneratedImage {
  base64: string;
  content_type: string;
  width: number;
  height: number;
}

export interface ModalGenerateResponse {
  images: ModalGeneratedImage[];
}

// =============================================================================
// Error Codes
// =============================================================================

export const SHOOT_ERROR_CODES = {
  // Validation errors
  INVALID_PROJECT: 'SHOOT_INVALID_PROJECT',
  INVALID_THEME: 'SHOOT_INVALID_THEME',
  MISSING_UPLOADS: 'SHOOT_MISSING_UPLOADS',

  // Training errors
  FAL_TRAINING_START_ERROR: 'SHOOT_FAL_TRAINING_START_ERROR',
  FAL_TRAINING_ERROR: 'SHOOT_FAL_TRAINING_ERROR',

  // Generation errors
  MODAL_GENERATION_ERROR: 'SHOOT_MODAL_GENERATION_ERROR',

  // Storage errors
  STORAGE_UPLOAD_ERROR: 'SHOOT_STORAGE_UPLOAD_ERROR',

  // Webhook errors
  WEBHOOK_SIGNATURE_INVALID: 'SHOOT_WEBHOOK_SIGNATURE_INVALID',
  WEBHOOK_JOB_NOT_FOUND: 'SHOOT_WEBHOOK_JOB_NOT_FOUND',

  // General errors
  JOB_NOT_FOUND: 'SHOOT_JOB_NOT_FOUND',
  FETCH_ERROR: 'SHOOT_FETCH_ERROR',
  UPDATE_ERROR: 'SHOOT_UPDATE_ERROR',
  TIMEOUT: 'SHOOT_TIMEOUT',
} as const;

export type ShootErrorCode = (typeof SHOOT_ERROR_CODES)[keyof typeof SHOOT_ERROR_CODES];

// =============================================================================
// Role Type
// =============================================================================

export type PersonRole = 'groom' | 'bride';
