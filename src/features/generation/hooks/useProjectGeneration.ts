'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHonoClient } from '@/lib/remote/hono-client';
import type { Generation, GenerationStatus } from '../types';

interface GenerationResponse {
  ok: true;
  data: Generation;
}

interface UseProjectGenerationResult {
  generation: Generation | undefined;
  isLoading: boolean;
  error: Error | null;
  createGeneration: () => Promise<Generation>;
  isCreating: boolean;
}

const fetchGenerationByProject = async (
  projectId: string
): Promise<Generation | null> => {
  const client = getHonoClient();

  try {
    const response = await client.api.generate.project[':projectId'].$get({
      param: { projectId },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch generation');
    }

    const result = (await response.json()) as GenerationResponse;
    return result.data;
  } catch (error) {
    // If it's a 404, return null (generation doesn't exist)
    return null;
  }
};

const createGenerationForProject = async (
  projectId: string,
  themeId?: string
): Promise<Generation> => {
  const client = getHonoClient();

  const response = await client.api.generate.$post({
    json: {
      projectId,
      themeId,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to create generation');
  }

  const result = (await response.json()) as GenerationResponse;
  return result.data;
};

export function useProjectGeneration(
  projectId: string,
  themeId?: string
): UseProjectGenerationResult {
  const queryClient = useQueryClient();
  const queryKey = ['generations', 'project', projectId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchGenerationByProject(projectId),
    enabled: Boolean(projectId),
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: () => createGenerationForProject(projectId, themeId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  return {
    generation: query.data ?? undefined,
    isLoading: query.isLoading,
    error: query.error,
    createGeneration: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
