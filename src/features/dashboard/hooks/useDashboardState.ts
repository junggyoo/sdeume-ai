'use client';

import { useMemo } from 'react';
import { useProjects } from '@/features/project/hooks/useProject';
import type { Project } from '@/features/project/types';
import type { DashboardState, DashboardStateResult } from '../types';
import { PROCESSING_STATUSES, COMPLETED_STATUS } from '../constants';

interface DeterminedState {
  state: DashboardState;
  processingProject: Project | null;
  completedProjects: Project[];
  allProjects: Project[];
}

/**
 * Pure function to determine dashboard state based on projects
 *
 * Priority order:
 * 1. processing - if any project is training or generating
 * 2. ready - if any project is completed
 * 3. new_user - default state (no projects, no uploads, or only drafts)
 */
export function determineDashboardState(
  projects: Project[] | undefined
): DeterminedState {
  // Default state for no projects or undefined
  if (!projects || projects.length === 0) {
    return {
      state: 'new_user',
      processingProject: null,
      completedProjects: [],
      allProjects: [],
    };
  }

  // Find processing project (training or generating)
  const processingProject = projects.find((project) =>
    PROCESSING_STATUSES.includes(project.status as typeof PROCESSING_STATUSES[number])
  );

  // Find all completed projects
  const completedProjects = projects.filter(
    (project) => project.status === COMPLETED_STATUS
  );

  // Priority 1: Processing state (has precedence over ready)
  if (processingProject) {
    return {
      state: 'processing',
      processingProject,
      completedProjects,
      allProjects: projects,
    };
  }

  // Priority 2: Ready state (has completed projects)
  if (completedProjects.length > 0) {
    return {
      state: 'ready',
      processingProject: null,
      completedProjects,
      allProjects: projects,
    };
  }

  // Default: new_user state
  // This includes: draft, uploading, theme_selecting, failed statuses
  // Or projects without any face uploads
  return {
    state: 'new_user',
    processingProject: null,
    completedProjects: [],
    allProjects: projects,
  };
}

/**
 * Hook to manage dashboard state based on user's projects
 *
 * Returns the current dashboard state along with relevant project data
 */
export function useDashboardState(): DashboardStateResult {
  const { data: projects, isLoading } = useProjects();

  const result = useMemo(() => {
    return determineDashboardState(projects);
  }, [projects]);

  return {
    state: result.state,
    processingProject: result.processingProject,
    completedProjects: result.completedProjects,
    allProjects: result.allProjects,
    isLoading,
  };
}
