'use client';

import { useMemo } from 'react';
import type { Project, LatestGeneration } from '@/features/project/types';
import type { Pictorial } from '../types';

interface UseCompletedGenerationsResult {
  pictorials: Pictorial[];
}

function transformToPictorial(
  generation: LatestGeneration,
  project: Project
): Pictorial {
  return {
    id: generation.id,
    projectId: project.id,
    projectName: project.name,
    themeName: null, // Theme name could be fetched separately if needed
    themeDisplayNameKo: null,
    images: generation.images ?? [],
    completedAt: generation.completedAt ?? generation.createdAt,
    createdAt: generation.createdAt,
  };
}

/**
 * Hook to get completed generations (pictorials) from projects
 *
 * Uses project.latestGeneration which is already JOINed in the projects query,
 * eliminating the need for separate API calls per project.
 *
 * Filters to only include generations with status 'completed' and images.
 */
export function useCompletedGenerations(
  projects: Project[]
): UseCompletedGenerationsResult {
  const pictorials = useMemo(() => {
    if (projects.length === 0) {
      return [];
    }

    const results: Pictorial[] = [];

    projects.forEach((project) => {
      const generation = project.latestGeneration;

      // Include if generation exists, is completed, and has images
      if (
        generation &&
        generation.status === 'completed' &&
        generation.images &&
        generation.images.length > 0
      ) {
        results.push(transformToPictorial(generation, project));
      }
    });

    // Sort by completedAt date (newest first)
    return results.sort((a, b) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return dateB - dateA;
    });
  }, [projects]);

  return { pictorials };
}
