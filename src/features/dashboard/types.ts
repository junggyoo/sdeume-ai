import type { Project } from '@/features/project/types';
import type { GenerationImage } from '@/features/generation/types';

/**
 * Dashboard state based on user's project status
 * - new_user: No projects or no face uploads yet
 * - processing: Has project with status 'training' or 'generating'
 * - ready: Has at least one completed project with generated images
 */
export type DashboardState = 'new_user' | 'processing' | 'ready';

/**
 * Pictorial represents a completed generation with its images
 */
export interface Pictorial {
  id: string;
  projectId: string;
  projectName: string | null;
  themeName: string | null;
  themeDisplayNameKo: string | null;
  images: GenerationImage[];
  completedAt: string;
  createdAt: string;
}

/**
 * Result of useDashboardState hook
 */
export interface DashboardStateResult {
  state: DashboardState;
  processingProject: Project | null;
  completedProjects: Project[];
  /** All projects for the user (used to fetch all generations) */
  allProjects: Project[];
  isLoading: boolean;
}

/**
 * Props for HeroSection component
 */
export interface HeroSectionProps {
  state: DashboardState;
  processingProject: Project | null;
  onCreateProject?: () => void;
  isCreatingProject?: boolean;
}

/**
 * Props for GallerySection component
 */
export interface GallerySectionProps {
  pictorials: Pictorial[];
  isLoading: boolean;
}

/**
 * Props for PictorialCard component
 */
export interface PictorialCardProps {
  pictorial: Pictorial;
}

/**
 * Props for EmptyGalleryState component
 */
export interface EmptyGalleryStateProps {
  message?: string;
}

/**
 * Props for ProcessingIndicator component
 */
export interface ProcessingIndicatorProps {
  project: Project;
}
