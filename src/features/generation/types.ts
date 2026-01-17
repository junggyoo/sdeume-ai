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
  // LoRA training fields
  groomFalJobId?: string | null;
  groomLoraUrl?: string | null;
  brideFalJobId?: string | null;
  brideLoraUrl?: string | null;
  trainingCompletedAt?: string | null;
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
  // LoRA training fields (snake_case for DB)
  groom_fal_job_id?: string | null;
  groom_lora_url?: string | null;
  bride_fal_job_id?: string | null;
  bride_lora_url?: string | null;
  training_completed_at?: string | null;
}
