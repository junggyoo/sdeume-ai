export type GenerationStatus =
  | 'queued'
  | 'training'
  | 'generating'
  | 'completed'
  | 'failed';

export interface GenerationImage {
  url: string;
  is_blur: boolean;
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
}
