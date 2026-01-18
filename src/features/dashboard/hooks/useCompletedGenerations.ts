'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '@/lib/remote/api-client';
import type { Project } from '@/features/project/types';
import type { Generation } from '@/features/generation/types';
import type { Pictorial } from '../types';

interface GenerationResponse {
  ok: true;
  data: Generation;
}

interface UseCompletedGenerationsResult {
  pictorials: Pictorial[];
  isLoading: boolean;
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

function transformToPictorial(
  generation: Generation,
  project: Project
): Pictorial {
  return {
    id: generation.id,
    projectId: generation.projectId,
    projectName: project.name,
    themeName: null, // Theme name could be fetched separately if needed
    themeDisplayNameKo: null,
    images: generation.images ?? [],
    completedAt: generation.completedAt ?? generation.createdAt,
    createdAt: generation.createdAt,
  };
}

/**
 * Hook to fetch completed generations for all given projects
 *
 * Note: This hook fetches generations for ALL projects passed to it,
 * not just projects with 'completed' status. The filtering of completed
 * generations happens based on generation.status === 'completed'.
 *
 * This allows displaying pictorials even if the project status has changed.
 */
export function useCompletedGenerations(
  projects: Project[]
): UseCompletedGenerationsResult {
  const queries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ['generations', 'project', project.id],
      queryFn: () => fetchGenerationForProject(project.id),
      staleTime: 30 * 1000,
    })),
  });

  const isLoading = queries.some((query) => query.isLoading);

  const pictorials = useMemo(() => {
    if (projects.length === 0) {
      return [];
    }

    const results: Pictorial[] = [];

    queries.forEach((query, index) => {
      const generation = query.data;
      const project = projects[index];

      // Include if generation exists, is completed, and has images
      if (generation && generation.status === 'completed' && generation.images && generation.images.length > 0) {
        results.push(transformToPictorial(generation, project));
      }
    });

    // Sort by completedAt date (newest first)
    return results.sort((a, b) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return dateB - dateA;
    });
  }, [queries, projects]);

  return {
    pictorials,
    isLoading,
  };
}
