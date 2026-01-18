'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, WifiOff } from 'lucide-react';
import { useProject } from '@/features/project/hooks/useProject';
import { useProjectGeneration } from '@/features/generation/hooks/useProjectGeneration';
import { useGenerationJob } from '@/features/generation/hooks/useGenerationJob';
import {
  TrainingProgress,
  LiveDarkroom,
  AuroraBackground,
} from '@/features/shooting/components';
import { Button } from '@/components/ui/button';
import { useNetworkState } from 'react-use';
import type { GenerationImage, GenerationStatus } from '@/features/generation/types';

type Phase = 'loading' | 'training' | 'generating' | 'completed' | 'error';

function determinePhase(
  status: GenerationStatus | undefined,
  isLoading: boolean,
  error: Error | null
): Phase {
  if (isLoading) return 'loading';
  if (error) return 'error';
  if (!status) return 'loading';

  switch (status) {
    case 'queued':
    case 'training':
      return 'training';
    case 'generating':
      return 'generating';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'error';
    default:
      return 'loading';
  }
}

export default function ShootingPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const networkState = useNetworkState();
  const isOnline = networkState.online ?? true;

  const { data: project } = useProject(params.projectId);
  const {
    generation: projectGeneration,
    isLoading: isLoadingGeneration,
    createGeneration,
    isCreating,
    regenerate,
    isRegenerating,
  } = useProjectGeneration(params.projectId, project?.selectedThemeId ?? undefined);

  const generationId = projectGeneration?.id ?? '';

  const [droppedImages, setDroppedImages] = useState<GenerationImage[]>([]);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [isRegenerateMode, setIsRegenerateMode] = useState(false);
  const hasSeenGeneratingRef = useRef(false);

  // Create generation if it doesn't exist, or regenerate if completed
  useEffect(() => {
    if (isLoadingGeneration || isCreating || isRegenerating || !project) return;

    // No generation exists - create new one
    if (!projectGeneration) {
      createGeneration().catch((err) => {
        console.error('[Shooting] Failed to create generation:', err);
        setInitError(err);
      });
      return;
    }

    // Generation exists and is completed with LoRA - regenerate
    if (
      projectGeneration.status === 'completed' &&
      projectGeneration.groomLoraUrl &&
      projectGeneration.brideLoraUrl &&
      !isRegenerateMode
    ) {
      console.log('[Shooting] Regenerating with existing LoRA...');
      setIsRegenerateMode(true);
      regenerate().catch((err) => {
        console.error('[Shooting] Failed to regenerate:', err);
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
    newImagesQueue,
    consumeNewImage,
  } = useGenerationJob(generationId, {
    enabled: Boolean(generationId),
  });

  const isLoading = isLoadingGeneration || isCreating || isRegenerating || (isPollingLoading && !generation);
  const error = initError || pollingError;

  const phase = useMemo(
    () => determinePhase(generation?.status, isLoading, error),
    [generation?.status, isLoading, error]
  );

  // Process images from queue one at a time
  const processNextImage = useCallback(() => {
    if (newImagesQueue.length === 0 || isProcessingDrop) return;

    setIsProcessingDrop(true);
    const image = consumeNewImage();

    if (image) {
      setDroppedImages((prev) => [...prev, image]);
    }

    // Allow next image after a short delay for animation
    setTimeout(() => {
      setIsProcessingDrop(false);
    }, 600);
  }, [newImagesQueue, isProcessingDrop, consumeNewImage]);

  // Process queue when new images arrive
  useEffect(() => {
    if (newImagesQueue.length > 0 && !isProcessingDrop) {
      processNextImage();
    }
  }, [newImagesQueue, isProcessingDrop, processNextImage]);

  // Track when we enter the generating phase
  useEffect(() => {
    if (phase === 'generating' || phase === 'training') {
      hasSeenGeneratingRef.current = true;
    }
  }, [phase]);

  // Redirect to reveal when completed (only after going through generating phase)
  useEffect(() => {
    if (phase !== 'completed') return;

    // Only redirect if we've been through the generating/training phase
    // This prevents redirect when we first load a completed generation that needs regeneration
    if (!hasSeenGeneratingRef.current) {
      return;
    }

    router.push(`/studio/${params.projectId}/reveal`);
  }, [phase, params.projectId, router]);

  // Handle retry
  const handleRetry = () => {
    router.push(`/studio/${params.projectId}/theme`);
  };

  // Handle image complete callback
  const handleImageComplete = useCallback((image: GenerationImage) => {
    console.log('[Shooting] Image revealed:', image.url);
  }, []);

  // Offline state
  if (!isOnline && isPolling) {
    return (
      <div className="relative min-h-screen bg-primary-desktop overflow-hidden">
        <AuroraBackground />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white">
          <WifiOff className="w-12 h-12 mb-4 text-white/60" />
          <p className="text-lg mb-2">인터넷 연결을 확인해주세요</p>
          <p className="text-sm text-white/60">
            연결되면 자동으로 재개됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-primary-desktop overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-testid="loading-state"
              className="flex flex-col items-center justify-center min-h-screen text-white"
            >
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-lg">준비 중...</p>
            </motion.div>
          )}

          {/* Phase 1: Training */}
          {phase === 'training' && (
            <TrainingProgress key="training" status={generation?.status} />
          )}

          {/* Phase 2: Generating */}
          {phase === 'generating' && (
            <LiveDarkroom
              key="darkroom"
              images={droppedImages}
              isGenerating={isPolling}
              onImageComplete={handleImageComplete}
            />
          )}

          {/* Error State */}
          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-screen text-white px-6"
            >
              <AlertCircle className="w-12 h-12 mb-4 text-state-error" />
              <h2 className="font-serif text-xl mb-2">
                촬영 중 문제가 발생했어요
              </h2>
              <p className="text-white/60 text-center mb-6">
                {error?.message || '잠시 후 다시 시도해주세요'}
              </p>
              <Button
                onClick={handleRetry}
                className="bg-white text-primary-desktop hover:bg-white/90"
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
