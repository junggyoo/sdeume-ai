export type GenerationStatus =
  | 'queued'
  | 'training'
  | 'generating'
  | 'completed'
  | 'failed';

export interface GenerationImage {
  url: string;
  is_blur: boolean;
  thumbnail_url?: string;
  blur_hash?: string;
}

export interface Generation {
  id: string;
  projectId: string;
  userId: string;
  modalJobId: string | null;
  themeId: string | null;
  prompt: string | null;
  parameters: Record<string, unknown>;
  status: GenerationStatus;
  images: GenerationImage[];
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  trainingCompletedAt?: string | null;
  // FK fields referencing lora_models
  groomLoraModelId?: string | null;
  brideLoraModelId?: string | null;
  // LoRA data from JOINed lora_models (derived fields)
  groomFalJobId?: string | null;
  groomLoraUrl?: string | null;
  brideFalJobId?: string | null;
  brideLoraUrl?: string | null;
}

/**
 * Joined LoRA model data from lora_models table
 */
export interface LoraModelJoin {
  id: string;
  model_url: string | null;
  status: string;
  fal_job_id: string | null;
}

export interface GenerationRow {
  id: string;
  project_id: string;
  user_id: string;
  modal_job_id: string | null;
  theme_id: string | null;
  prompt: string | null;
  parameters: Record<string, unknown>;
  status: string;
  images: GenerationImage[] | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  training_completed_at?: string | null;
  // FK fields referencing lora_models
  groom_lora_model_id?: string | null;
  bride_lora_model_id?: string | null;
  // JOIN results (when queried with relations)
  groom_lora?: LoraModelJoin | null;
  bride_lora?: LoraModelJoin | null;
}
