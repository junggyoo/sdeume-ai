'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getHonoClient } from '@/lib/remote/hono-client';
import type {
  Generation,
  GenerationImage,
  GenerationStatus,
} from '../types';

// =============================================================================
// Query Keys Factory
// =============================================================================

export const generationKeys = {
  all: ['generations'] as const,
  detail: (id: string) => ['generations', id] as const,
  status: (id: string) => ['generations', id, 'status'] as const,
};

// =============================================================================
// Polling Configuration
// =============================================================================

const POLLING_INTERVALS: Record<GenerationStatus, number | false> = {
  queued: 5000, // 5s for initial waiting
  preparing_training: 5000, // 5s during training preparation (ZIP creation)
  training: 5000, // 5s during training
  generating: 2000, // 2s during active generation (real-time feel)
  completed: false, // Stop polling
  failed: false, // Stop polling
};

// =============================================================================
// Types
// =============================================================================

interface GenerationResponse {
  ok: true;
  data: Generation;
}

interface UseGenerationJobOptions {
  enabled?: boolean;
  onStatusChange?: (from: GenerationStatus, to: GenerationStatus) => void;
  onNewImages?: (images: GenerationImage[]) => void;
}

interface UseGenerationJobResult {
  generation: Generation | undefined;
  isLoading: boolean;
  isPolling: boolean;
  error: Error | null;
  newImagesQueue: GenerationImage[];
  consumeNewImage: () => GenerationImage | undefined;
  clearNewImagesQueue: () => void;
}

// =============================================================================
// Fetcher
// =============================================================================

const fetchGeneration = async (generationId: string): Promise<Generation> => {
  const client = getHonoClient();
  const response = await client.api.generate[':generationId'].$get({
    param: { generationId },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch generation');
  }

  const result = (await response.json()) as GenerationResponse;
  if (!result.ok) {
    throw new Error('Invalid response from server');
  }

  return result.data;
};

// =============================================================================
// Hook
// =============================================================================

export function useGenerationJob(
  generationId: string,
  options: UseGenerationJobOptions = {}
): UseGenerationJobResult {
  const { enabled = true, onStatusChange, onNewImages } = options;

  // Track previous data for diffing
  const prevDataRef = useRef<Generation | null>(null);

  // New images queue for drop animation
  const [newImagesQueue, setNewImagesQueue] = useState<GenerationImage[]>([]);

  // Calculate polling interval based on current status
  const getPollingInterval = useCallback(
    (status?: GenerationStatus): number | false => {
      if (!status) return 5000; // Default for initial load
      return POLLING_INTERVALS[status];
    },
    []
  );

  // TanStack Query with adaptive polling
  const query = useQuery({
    queryKey: generationKeys.status(generationId),
    queryFn: () => fetchGeneration(generationId),
    enabled: enabled && Boolean(generationId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return getPollingInterval(status);
    },
    staleTime: 0, // Always fetch fresh data during polling
  });

  // Handle status transitions and image diffing
  useEffect(() => {
    const currentData = query.data;
    if (!currentData) return;

    const prevData = prevDataRef.current;

    // Detect status change (training -> generating alert)
    if (prevData && currentData.status !== prevData.status) {
      // Log status transition
      console.log(
        `[Generation] Status changed: ${prevData.status} -> ${currentData.status}`
      );

      // Trigger callback
      onStatusChange?.(prevData.status, currentData.status);

      // Special handling for training -> generating transition
      if (
        prevData.status === 'training' &&
        currentData.status === 'generating'
      ) {
        console.log(
          '[Generation] Training complete! Starting image generation...'
        );
        // Future: trigger toast notification or push alert
      }
    }

    // Detect new images (diffing logic)
    if (currentData.images.length > 0) {
      const prevUrls = prevData
        ? new Set(prevData.images.map((img) => img.url))
        : new Set<string>();
      const newImages = currentData.images.filter(
        (img) => !prevUrls.has(img.url)
      );

      if (newImages.length > 0) {
        console.log(`[Generation] ${newImages.length} new image(s) detected`);
        setNewImagesQueue((prev) => [...prev, ...newImages]);
        onNewImages?.(newImages);
      }
    }

    // Update ref for next comparison
    prevDataRef.current = currentData;
  }, [query.data, onStatusChange, onNewImages]);

  // Queue consumer for drop animation (consumes one image at a time)
  const consumeNewImage = useCallback((): GenerationImage | undefined => {
    if (newImagesQueue.length === 0) return undefined;

    const [first, ...rest] = newImagesQueue;
    setNewImagesQueue(rest);
    return first;
  }, [newImagesQueue]);

  // Clear entire queue
  const clearNewImagesQueue = useCallback(() => {
    setNewImagesQueue([]);
  }, []);

  // Determine if still polling
  const isPolling = Boolean(
    query.data?.status && POLLING_INTERVALS[query.data.status] !== false
  );

  return {
    generation: query.data,
    isLoading: query.isLoading,
    isPolling,
    error: query.error,
    newImagesQueue,
    consumeNewImage,
    clearNewImagesQueue,
  };
}
