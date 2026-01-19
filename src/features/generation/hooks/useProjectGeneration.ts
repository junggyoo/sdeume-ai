'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHonoClient } from '@/lib/remote/hono-client';
import type { Generation } from '../types';

interface GenerationResponse {
  ok: true;
  data: Generation | null;
}

interface UseProjectGenerationResult {
  generation: Generation | undefined;
  isLoading: boolean;
  error: Error | null;
  createGeneration: () => Promise<Generation>;
  isCreating: boolean;
  regenerate: () => Promise<Generation>;
  isRegenerating: boolean;
}

const fetchGenerationByProject = async (
  projectId: string
): Promise<Generation | null> => {
  const client = getHonoClient();

  const response = await client.api.generate.project[':projectId'].$get({
    param: { projectId },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch generation');
  }

  // API returns { ok: true, data: Generation | null }
  // data is null when generation doesn't exist yet (not an error)
  const result = (await response.json()) as GenerationResponse;
  return result.data;
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

const regenerateForGeneration = async (
  generationId: string
): Promise<Generation> => {
  const client = getHonoClient();

  const response = await client.api.generate[':generationId'].regenerate.$post({
    param: { generationId },
  });

  if (!response.ok) {
    throw new Error('Failed to regenerate');
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
      // Invalidate the generation job query to ensure fresh polling starts
      queryClient.invalidateQueries({
        queryKey: ['generations', data.id, 'status'],
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => {
      const generationId = query.data?.id;
      if (!generationId) {
        throw new Error('No generation to regenerate');
      }
      return regenerateForGeneration(generationId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      // Invalidate the generation job query to restart polling with fresh data
      queryClient.invalidateQueries({
        queryKey: ['generations', data.id, 'status'],
      });
    },
  });

  return {
    generation: query.data ?? undefined,
    isLoading: query.isLoading,
    error: query.error,
    createGeneration: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    regenerate: regenerateMutation.mutateAsync,
    isRegenerating: regenerateMutation.isPending,
  };
}
