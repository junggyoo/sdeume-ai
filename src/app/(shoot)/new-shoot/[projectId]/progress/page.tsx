'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';
import { useProject } from '@/features/project/hooks/useProject';
import { useProjectGeneration } from '@/features/generation/hooks/useProjectGeneration';
import { useGenerationJob } from '@/features/generation/hooks/useGenerationJob';
import { useThemes } from '@/features/theme/hooks/useThemes';
import { AuroraBackground } from '@/features/shooting/components';
import {
  PROGRESS_CONFIG,
  type WaitingPhase,
} from '@/features/shooting/constants';
import { Button } from '@/components/ui/button';
import { useNetworkState } from 'react-use';
import GeneratingStage, { type GeneratingPhase } from '@/components/GeneratingStage';
import type {
  GenerationImage,
  GenerationStatus,
} from '@/features/generation/types';

type Phase = 'loading' | 'training' | 'generating' | 'completed' | 'error';

function determinePhase(
  status: GenerationStatus | undefined,
  isInitialLoading: boolean,
  error: Error | null
): Phase {
  if (error) return 'error';

  if (status) {
    switch (status) {
      case 'queued':
      case 'preparing_training':
      case 'training':
        // All three statuses show as 'training' phase for UI continuity
        return 'training';
      case 'generating':
        return 'generating';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'error';
    }
  }

  if (isInitialLoading) return 'loading';

  return 'loading';
}

function mapPhaseToWaitingPhase(phase: Phase): WaitingPhase {
  if (phase === 'training') return 'learning';
  if (phase === 'generating') return 'generating';
  return 'complete';
}

function mapPhaseToGeneratingPhase(phase: Phase): GeneratingPhase {
  if (phase === 'training') return 'training';
  if (phase === 'generating') return 'generating';
  return 'complete';
}

function calculateProgress(
  waitingPhase: WaitingPhase,
  startedAt: string | null,
  images: GenerationImage[]
): number {
  if (waitingPhase === 'complete') return 100;

  if (waitingPhase === 'learning') {
    if (!startedAt) return 0;
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const progress = Math.min(
      (elapsed / PROGRESS_CONFIG.learningDuration) *
        PROGRESS_CONFIG.learningMaxProgress,
      PROGRESS_CONFIG.learningMaxProgress
    );
    return Math.round(progress);
  }

  if (waitingPhase === 'generating') {
    const imageProgress = (images.length / PROGRESS_CONFIG.totalImages) * 50;
    return Math.round(PROGRESS_CONFIG.learningMaxProgress + imageProgress);
  }

  return 0;
}

export default function ProgressPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const networkState = useNetworkState();
  const isOnline = networkState.online ?? true;

  const { data: project } = useProject(params.projectId);
  const { data: themes } = useThemes();
  const {
    generation: projectGeneration,
    isLoading: isLoadingGeneration,
    createGeneration,
    isCreating,
    regenerate,
    isRegenerating,
  } = useProjectGeneration(
    params.projectId,
    project?.selectedThemeId ?? undefined
  );

  const generationId = projectGeneration?.id ?? '';

  const [initError, setInitError] = useState<Error | null>(null);
  const [isRegenerateMode, setIsRegenerateMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasSeenGeneratingRef = useRef(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedTheme = useMemo(() => {
    if (!project?.selectedThemeId || !themes) return null;
    return themes.find((t) => t.id === project.selectedThemeId) || null;
  }, [project?.selectedThemeId, themes]);

  const themeImage = selectedTheme?.thumbnailUrl || selectedTheme?.sampleImages?.[0] || '/images/default-theme.jpg';

  useEffect(() => {
    if (isLoadingGeneration || isCreating || isRegenerating || !project) return;

    if (!projectGeneration) {
      createGeneration().catch((err) => {
        console.error('[Progress] Failed to create generation:', err);
        setInitError(err);
      });
      return;
    }

    if (
      projectGeneration.status === 'completed' &&
      projectGeneration.groomLoraUrl &&
      projectGeneration.brideLoraUrl &&
      !isRegenerateMode
    ) {
      setIsRegenerateMode(true);
      regenerate().catch((err) => {
        console.error('[Progress] Failed to regenerate:', err);
        setInitError(err);
      });
    }
  }, [
    isLoadingGeneration,
    projectGeneration,
    isCreating,
    isRegenerating,
    project,
    createGeneration,
    regenerate,
    isRegenerateMode,
  ]);

  const {
    generation,
    isLoading: isPollingLoading,
    isPolling,
    error: pollingError,
  } = useGenerationJob(generationId, {
    enabled: Boolean(generationId),
  });

  const isInitialLoading =
    !generation && (isLoadingGeneration || isCreating || isPollingLoading);
  const error = initError || pollingError;

  const phase = useMemo(
    () => determinePhase(generation?.status, isInitialLoading, error),
    [generation?.status, isInitialLoading, error]
  );

  const waitingPhase = useMemo(() => mapPhaseToWaitingPhase(phase), [phase]);
  const generatingPhase = useMemo(() => mapPhaseToGeneratingPhase(phase), [phase]);

  useEffect(() => {
    if (phase === 'loading' || phase === 'error' || phase === 'completed') {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (phase === 'completed') {
        setProgress(100);
      }
      return;
    }

    const updateProgress = () => {
      const newProgress = calculateProgress(
        waitingPhase,
        generation?.startedAt || null,
        generation?.images || []
      );
      setProgress(newProgress);
    };

    updateProgress();
    progressIntervalRef.current = setInterval(updateProgress, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [phase, waitingPhase, generation?.startedAt, generation?.images]);

  useEffect(() => {
    if (phase === 'generating' || phase === 'training') {
      hasSeenGeneratingRef.current = true;
    }
  }, [phase]);

  const handleViewResults = useCallback(() => {
    router.push(`/new-shoot/${params.projectId}/results`);
  }, [router, params.projectId]);

  const handleRetry = useCallback(() => {
    router.push(`/new-shoot/${params.projectId}/step2`);
  }, [router, params.projectId]);

  if (!isOnline && isPolling) {
    return (
      <div className="fixed inset-0 bg-slate-950 overflow-hidden z-50">
        <AuroraBackground />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
          <WifiOff className="w-12 h-12 mb-4 text-white/60" />
          <p className="text-lg mb-2">인터넷 연결을 확인해주세요</p>
          <p className="text-sm text-white/60">연결되면 자동으로 재개됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-y-auto z-50">
      <AuroraBackground />

      <div className="relative z-10 min-h-full">
        <AnimatePresence mode="wait">
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-screen text-white"
            >
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-lg">준비 중...</p>
            </motion.div>
          )}

          {(phase === 'training' || phase === 'generating' || phase === 'completed') && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen"
            >
              <GeneratingStage
                themeImage={themeImage}
                onFinish={handleViewResults}
                controlledPhase={generatingPhase}
                controlledProgress={progress}
                completedPhotos={generation?.images?.length ?? 0}
                totalPhotos={12}
              />
            </motion.div>
          )}

          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-screen text-white px-6"
            >
              <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
              <h2 className="font-serif text-xl mb-2">
                촬영 중 문제가 발생했어요
              </h2>
              <p className="text-white/60 text-center mb-6">
                {error?.message || '잠시 후 다시 시도해주세요'}
              </p>
              <Button
                onClick={handleRetry}
                className="bg-white text-slate-900 hover:bg-white/90"
              >
                다시 시도
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
