export type ProjectStatus =
  | 'draft'
  | 'uploading'
  | 'optimizing'
  | 'theme_selecting'
  | 'training'
  | 'generating'
  | 'completed'
  | 'failed';

export type ProjectStep = 1 | 2 | 3 | 4 | 5;

export interface Project {
  id: string;
  userId: string;
  name: string | null;
  status: ProjectStatus;
  currentStep: ProjectStep;
  selectedThemeId: string | null;
  planId: string | null;
  groomUploadCount: number;
  brideUploadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name?: string;
}

export interface UpdateProjectInput {
  name?: string;
  status?: ProjectStatus;
  currentStep?: ProjectStep;
  selectedThemeId?: string;
}

export interface ProjectWithTheme extends Project {
  theme?: {
    id: string;
    name: string;
    displayNameKo: string;
  };
}
