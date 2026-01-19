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
  failedProjects: Project[];
  allProjects: Project[];
  hasFaceModel: boolean;
}

/**
 * Pure function to determine dashboard state based on projects
 *
 * Priority order:
 * 1. processing - if any project is training or generating (but NOT if generation is completed OR failed)
 * 2. ready - if hasFaceModel (user uploaded photos) OR completed projects exist OR completed generations exist
 * 3. onboarding - no face uploads (true new user)
 *
 * @param projects - List of user's projects with latestGeneration included
 */
export function determineDashboardState(
  projects: Project[] | undefined
): DeterminedState {
  // Default state for no projects or undefined
  if (!projects || projects.length === 0) {
    return {
      state: 'onboarding',
      processingProject: null,
      completedProjects: [],
      failedProjects: [],
      allProjects: [],
      hasFaceModel: false,
    };
  }

  // Check if user has uploaded face photos
  const hasFaceModel = projects.some(
    (p) => p.groomUploadCount > 0 || p.brideUploadCount > 0
  );

  // Find processing project (training or generating)
  // Skip projects that have completed OR failed generations (project.status may be stale)
  const processingProject = projects.find((project) => {
    const isStatusProcessing = PROCESSING_STATUSES.includes(
      project.status as (typeof PROCESSING_STATUSES)[number]
    );
    // Use latestGeneration status to check if generation is actually completed or failed
    const generationStatus = project.latestGeneration?.status;
    const hasCompletedGeneration = generationStatus === 'completed';
    const hasFailedGeneration = generationStatus === 'failed';
    return isStatusProcessing && !hasCompletedGeneration && !hasFailedGeneration;
  });

  // Find all completed projects
  const completedProjects = projects.filter(
    (project) => project.status === COMPLETED_STATUS
  );

  // Find all failed projects (projects where generation has failed)
  const failedProjects = projects.filter(
    (project) => project.latestGeneration?.status === 'failed'
  );

  // Priority 1: Processing state (has precedence over ready)
  if (processingProject) {
    return {
      state: 'processing',
      processingProject,
      completedProjects,
      failedProjects,
      allProjects: projects,
      hasFaceModel,
    };
  }

  // Check if we have any completed generations
  const hasCompletedGenerations = projects.some(
    (project) => project.latestGeneration?.status === 'completed'
  );

  // Priority 2: Ready state (has face model OR completed projects OR completed generations)
  if (completedProjects.length > 0 || hasFaceModel || hasCompletedGenerations) {
    return {
      state: 'ready',
      processingProject: null,
      completedProjects,
      failedProjects,
      allProjects: projects,
      hasFaceModel,
    };
  }

  // Default: onboarding state (no face uploads - true new user)
  return {
    state: 'onboarding',
    processingProject: null,
    completedProjects: [],
    failedProjects,
    allProjects: projects,
    hasFaceModel: false,
  };
}

/**
 * Hook to manage dashboard state based on user's projects
 *
 * Projects are fetched with latestGeneration included (via JOIN),
 * eliminating the need for separate generation API calls.
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
    failedProjects: result.failedProjects,
    allProjects: result.allProjects,
    hasFaceModel: result.hasFaceModel,
    isLoading,
  };
}
