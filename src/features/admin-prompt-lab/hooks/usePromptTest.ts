'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type {
  PromptOverrides,
  NodeOverrides,
  AssembledPrompts,
  PromptTestImage,
  PromptTestGenerateResponse,
  PromptTestStatusResponse,
  PromptTestStatus,
} from '../types';
import type { ThemeSlug, ShotType } from '@/features/shooting/types';

// =============================================================================
// Types
// =============================================================================

interface UsePromptTestParams {
  onSuccess?: (response: PromptTestStatusResponse) => void;
  onError?: (error: string) => void;
  onNewImages?: (images: PromptTestImage[]) => void;
}

interface GenerateParams {
  themeSlug: ThemeSlug;
  shotType: ShotType;
  groomLoraUrl: string;
  brideLoraUrl: string;
  promptOverrides?: PromptOverrides;
  nodeOverrides?: NodeOverrides;
  seed?: number;
  extraStyleTags?: string;
  count?: number;
}

interface UsePromptTestReturn {
  isGenerating: boolean;
  status: PromptTestStatus | null;
  progress: number;
  totalCount: number;
  error: string | null;
  images: PromptTestImage[];
  assembledPrompts: AssembledPrompts | null;
  generationTimeMs: number | null;
  seed: number | null;
  testId: string | null;
  generate: (params: GenerateParams) => Promise<void>;
  reset: () => void;
}

// =============================================================================
// Polling Intervals
// =============================================================================

const POLLING_INTERVALS: Record<PromptTestStatus, number | false> = {
  queued: 3000,
  generating: 2000,
  completed: false,
  failed: false,
};

// =============================================================================
// Hook
// =============================================================================

export const usePromptTest = ({
  onSuccess,
  onError,
  onNewImages,
}: UsePromptTestParams = {}): UsePromptTestReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<PromptTestStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<PromptTestImage[]>([]);
  const [assembledPrompts, setAssembledPrompts] = useState<AssembledPrompts | null>(null);
  const [generationTimeMs, setGenerationTimeMs] = useState<number | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [testId, setTestId] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevImageCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`/api/admin/prompt-test/status/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await response.json();
      if (!data.ok) return;

      const statusData = data.data as PromptTestStatusResponse;

      setStatus(statusData.status);
      setProgress(statusData.progress);
      setTotalCount(statusData.totalCount);
      setGenerationTimeMs(statusData.generationTimeMs);

      // Detect new images
      const currentImages = statusData.images ?? [];
      if (currentImages.length > prevImageCountRef.current) {
        const newImages = currentImages.slice(prevImageCountRef.current);
        onNewImages?.(newImages);
        prevImageCountRef.current = currentImages.length;
      }
      setImages(currentImages);

      // Handle terminal states
      if (statusData.status === 'completed') {
        stopPolling();
        setIsGenerating(false);
        onSuccess?.(statusData);
      } else if (statusData.status === 'failed') {
        stopPolling();
        setIsGenerating(false);
        const errorMsg = statusData.errorMessage || 'Generation failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch {
      // Silently ignore polling errors - will retry on next interval
    }
  }, [stopPolling, onSuccess, onError, onNewImages]);

  const startPolling = useCallback((id: string, initialStatus: PromptTestStatus) => {
    stopPolling();

    const interval = POLLING_INTERVALS[initialStatus];
    if (interval === false) return;

    // Initial poll
    pollStatus(id);

    pollingRef.current = setInterval(() => {
      pollStatus(id);
    }, interval);
  }, [stopPolling, pollStatus]);

  // Update polling interval when status changes
  useEffect(() => {
    if (!testId || !status) return;

    const interval = POLLING_INTERVALS[status];
    if (interval === false) {
      stopPolling();
      return;
    }

    // Restart with new interval
    stopPolling();
    pollingRef.current = setInterval(() => {
      pollStatus(testId);
    }, interval);
  }, [status, testId, stopPolling, pollStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const generate = useCallback(async (params: GenerateParams) => {
    setIsGenerating(true);
    setError(null);
    setImages([]);
    setProgress(0);
    setTotalCount(0);
    setStatus(null);
    setGenerationTimeMs(null);
    prevImageCountRef.current = 0;

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        const errorMessage = 'Not authenticated';
        setError(errorMessage);
        setIsGenerating(false);
        onError?.(errorMessage);
        return;
      }

      const response = await fetch('/api/admin/prompt-test/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.ok) {
        const errorMessage = data.error?.message || 'Generation failed';
        setError(errorMessage);
        setIsGenerating(false);
        onError?.(errorMessage);
        return;
      }

      const result = data.data as PromptTestGenerateResponse;
      setTestId(result.testId);
      setStatus(result.status);
      setAssembledPrompts(result.assembledPrompts);
      setSeed(result.seed);
      setTotalCount(params.count ?? 1);

      // Start polling for status updates
      startPolling(result.testId, result.status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsGenerating(false);
      onError?.(errorMessage);
    }
  }, [onError, startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setError(null);
    setImages([]);
    setProgress(0);
    setTotalCount(0);
    setStatus(null);
    setGenerationTimeMs(null);
    setAssembledPrompts(null);
    setSeed(null);
    setTestId(null);
    setIsGenerating(false);
    prevImageCountRef.current = 0;
  }, [stopPolling]);

  return {
    isGenerating,
    status,
    progress,
    totalCount,
    error,
    images,
    assembledPrompts,
    generationTimeMs,
    seed,
    testId,
    generate,
    reset,
  };
};
