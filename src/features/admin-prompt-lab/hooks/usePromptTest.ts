'use client';

import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type {
  PromptOverrides,
  NodeOverrides,
  AssembledPrompts,
  PromptTestImage,
  PromptTestGenerateResponse,
} from '../types';
import type { ThemeSlug, ShotType } from '@/features/shooting/types';

// =============================================================================
// Types
// =============================================================================

interface UsePromptTestParams {
  onSuccess?: (response: PromptTestGenerateResponse) => void;
  onError?: (error: string) => void;
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
}

interface UsePromptTestReturn {
  isGenerating: boolean;
  error: string | null;
  result: PromptTestGenerateResponse | null;
  generate: (params: GenerateParams) => Promise<void>;
  reset: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export const usePromptTest = ({
  onSuccess,
  onError,
}: UsePromptTestParams = {}): UsePromptTestReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromptTestGenerateResponse | null>(null);

  const generate = useCallback(async (params: GenerateParams) => {
    setIsGenerating(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        const errorMessage = 'Not authenticated';
        setError(errorMessage);
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
        onError?.(errorMessage);
        return;
      }

      const generatedResult: PromptTestGenerateResponse = {
        testId: data.data.testId,
        images: data.data.images as PromptTestImage[],
        assembledPrompts: data.data.assembledPrompts as AssembledPrompts,
        generationTimeMs: data.data.generationTimeMs,
        seed: data.data.seed,
      };

      setResult(generatedResult);
      onSuccess?.(generatedResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return {
    isGenerating,
    error,
    result,
    generate,
    reset,
  };
};
