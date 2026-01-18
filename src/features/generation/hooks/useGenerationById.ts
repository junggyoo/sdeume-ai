'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { Generation } from '../types';

interface GenerationResponse {
  ok: true;
  data: Generation;
}

async function fetchGenerationById(generationId: string): Promise<Generation | null> {
  try {
    const response = await apiClient.get<GenerationResponse>(
      `/api/generate/${generationId}`
    );
    if (response.data.ok) {
      return response.data.data;
    }
    return null;
  } catch {
    return null;
  }
}

interface UseGenerationByIdResult {
  generation: Generation | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch a single generation by its ID
 */
export function useGenerationById(generationId: string | undefined): UseGenerationByIdResult {
  const query = useQuery({
    queryKey: ['generations', generationId],
    queryFn: () => fetchGenerationById(generationId!),
    enabled: Boolean(generationId),
    staleTime: 30 * 1000,
  });

  return {
    generation: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
