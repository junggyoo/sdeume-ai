'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useProjects } from '@/features/project/hooks/useProject';
import { apiClient } from '@/lib/remote/api-client';
import type { Project } from '@/features/project/types';
import type { Generation } from '@/features/generation/types';
import type { DashboardState, DashboardStateResult } from '../types';
import { PROCESSING_STATUSES, COMPLETED_STATUS } from '../constants';

interface GenerationResponse {
  ok: true;
  data: Generation;
}

async function fetchGenerationForProject(
  projectId: string
): Promise<Generation | null> {
  try {
    const response = await apiClient.get<GenerationResponse>(
      `/api/generate/project/${projectId}`
    );
    if (response.data.ok) {
      return response.data.data;
    }
    return null;
  } catch {
    return null;
  }
}

interface DeterminedState {
  state: DashboardState;
  processingProject: Project | null;
  completedProjects: Project[];
  allProjects: Project[];
  hasFaceModel: boolean;
}

/**
 * Pure function to determine dashboard state based on projects
 *
 * Priority order:
 * 1. processing - if any project is training or generating (but NOT if generation is completed)
 * 2. ready - if hasFaceModel (user uploaded photos) OR completed projects exist OR completed generations exist
 * 3. onboarding - no face uploads (true new user)
 *
 * @param projects - List of user's projects
 * @param completedGenerationProjectIds - Set of project IDs that have completed generations
 *   (used to override project.status when generation has finished but project status is stale)
 */
export function determineDashboardState(
  projects: Project[] | undefined,
  completedGenerationProjectIds?: Set<string>
): DeterminedState {
  // Default state for no projects or undefined
  if (!projects || projects.length === 0) {
    return {
      state: 'onboarding',
      processingProject: null,
      completedProjects: [],
      allProjects: [],
      hasFaceModel: false,
    };
  }

  // Check if user has uploaded face photos
  const hasFaceModel = projects.some(
    (p) => p.groomUploadCount > 0 || p.brideUploadCount > 0
  );

  // Find processing project (training or generating)
  // Skip projects that have completed generations (project.status may be stale)
  const processingProject = projects.find((project) => {
    const isStatusProcessing = PROCESSING_STATUSES.includes(
      project.status as typeof PROCESSING_STATUSES[number]
    );
    // If generation is completed, project is not actually processing
    const hasCompletedGeneration = completedGenerationProjectIds?.has(project.id) ?? false;
    return isStatusProcessing && !hasCompletedGeneration;
  });

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
      hasFaceModel,
    };
  }

  // Check if we have any completed generations
  const hasCompletedGenerations = completedGenerationProjectIds && completedGenerationProjectIds.size > 0;

  // Priority 2: Ready state (has face model OR completed projects OR completed generations)
  if (completedProjects.length > 0 || hasFaceModel || hasCompletedGenerations) {
    return {
      state: 'ready',
      processingProject: null,
      completedProjects,
      allProjects: projects,
      hasFaceModel,
    };
  }

  // Default: onboarding state (no face uploads - true new user)
  return {
    state: 'onboarding',
    processingProject: null,
    completedProjects: [],
    allProjects: projects,
    hasFaceModel: false,
  };
}

/**
 * Hook to manage dashboard state based on user's projects
 *
 * Fetches generations for all projects to correctly determine state,
 * since project.status can be stale when generation has completed.
 *
 * Returns the current dashboard state along with relevant project data
 */
export function useDashboardState(): DashboardStateResult {
  const { data: projects, isLoading: projectsLoading } = useProjects();

  // Fetch generations for all projects to check actual completion status
  const generationQueries = useQueries({
    queries: (projects ?? []).map((project) => ({
      queryKey: ['generations', 'project', project.id],
      queryFn: () => fetchGenerationForProject(project.id),
      staleTime: 30 * 1000,
    })),
  });

  const generationsLoading = generationQueries.some((query) => query.isLoading);

  // Build set of project IDs that have completed generations
  const completedGenerationProjectIds = useMemo(() => {
    const projectIds = new Set<string>();
    generationQueries.forEach((query, index) => {
      const generation = query.data;
      const project = projects?.[index];
      if (
        generation &&
        generation.status === 'completed' &&
        project
      ) {
        projectIds.add(project.id);
      }
    });
    return projectIds;
  }, [generationQueries, projects]);

  const result = useMemo(() => {
    return determineDashboardState(projects, completedGenerationProjectIds);
  }, [projects, completedGenerationProjectIds]);

  return {
    state: result.state,
    processingProject: result.processingProject,
    completedProjects: result.completedProjects,
    allProjects: result.allProjects,
    hasFaceModel: result.hasFaceModel,
    isLoading: projectsLoading || generationsLoading,
  };
}
