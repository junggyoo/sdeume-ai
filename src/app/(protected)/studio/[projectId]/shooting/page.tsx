'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, WifiOff, Home, X } from 'lucide-react';
import { useProject } from '@/features/project/hooks/useProject';
import { useProjectGeneration } from '@/features/generation/hooks/useProjectGeneration';
import { useGenerationJob } from '@/features/generation/hooks/useGenerationJob';
import { useThemes } from '@/features/theme/hooks/useThemes';
import {
  AuroraBackground,
} from '@/features/shooting/components';
import {
  WaitingContent,
  CompleteScreen,
  DesktopPoster,
} from '@/features/shooting/components/waiting';
import { PROGRESS_CONFIG, type WaitingPhase } from '@/features/shooting/constants';
import { Button } from '@/components/ui/button';
import { useNetworkState } from 'react-use';
import type { GenerationImage, GenerationStatus } from '@/features/generation/types';

type Phase = 'loading' | 'training' | 'generating' | 'completed' | 'error';

function determinePhase(
  status: GenerationStatus | undefined,
  isInitialLoading: boolean,
  error: Error | null
): Phase {
  // 에러가 있으면 에러 상태
  if (error) return 'error';

  // status가 있으면 해당 phase 반환 (로딩보다 우선)
  if (status) {
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
    }
  }

  // status가 없고 초기 로딩 중이면 로딩
  if (isInitialLoading) return 'loading';

  return 'loading';
}

function mapPhaseToWaitingPhase(phase: Phase): WaitingPhase {
  if (phase === 'training') return 'learning';
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
      (elapsed / PROGRESS_CONFIG.learningDuration) * PROGRESS_CONFIG.learningMaxProgress,
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

export default function ShootingPage() {
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
  } = useProjectGeneration(params.projectId, project?.selectedThemeId ?? undefined);

  const generationId = projectGeneration?.id ?? '';

  const [initError, setInitError] = useState<Error | null>(null);
  const [isRegenerateMode, setIsRegenerateMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasSeenGeneratingRef = useRef(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get selected theme info
  const selectedTheme = useMemo(() => {
    if (!project?.selectedThemeId || !themes) return null;
    return themes.find((t) => t.id === project.selectedThemeId) || null;
  }, [project?.selectedThemeId, themes]);

  const themeName = selectedTheme?.name || '가든 스튜디오';

  // Create generation if it doesn't exist, or regenerate if completed
  useEffect(() => {
    if (isLoadingGeneration || isCreating || isRegenerating || !project) return;

    if (!projectGeneration) {
      createGeneration().catch((err) => {
        console.error('[Shooting] Failed to create generation:', err);
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
  } = useGenerationJob(generationId, {
    enabled: Boolean(generationId),
  });

  // 초기 로딩: generation 데이터가 전혀 없을 때만
  const isInitialLoading = !generation && (isLoadingGeneration || isCreating || isPollingLoading);
  const error = initError || pollingError;

  const phase = useMemo(
    () => determinePhase(generation?.status, isInitialLoading, error),
    [generation?.status, isInitialLoading, error]
  );

  const waitingPhase = useMemo(() => mapPhaseToWaitingPhase(phase), [phase]);

  // Update progress periodically
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

  // Track when we enter the generating phase
  useEffect(() => {
    if (phase === 'generating' || phase === 'training') {
      hasSeenGeneratingRef.current = true;
    }
  }, [phase]);

  // Handle navigation
  const handleHomeClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleCloseClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleViewResults = useCallback(() => {
    router.push(`/studio/${params.projectId}/reveal`);
  }, [router, params.projectId]);

  const handleRetry = useCallback(() => {
    router.push(`/studio/${params.projectId}/theme`);
  }, [router, params.projectId]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: '스드메 AI 화보',
        text: `${themeName} 컨셉으로 완성된 아름다운 AI 웨딩 화보를 확인하세요!`,
        url: window.location.href,
      }).catch(console.error);
    }
  }, [themeName]);

  // Offline state
  if (!isOnline && isPolling) {
    return (
      <div className="fixed inset-0 bg-slate-950 overflow-hidden z-50">
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
    <div className="fixed inset-0 bg-slate-950 overflow-y-auto z-50">
      <AuroraBackground />

      <div className="relative z-10 min-h-full">
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

          {/* Training or Generating Phase - New UI */}
          {(phase === 'training' || phase === 'generating') && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Desktop Layout (2 columns) */}
              <div className="hidden lg:grid lg:grid-cols-2 lg:h-screen">
                {/* Left: Desktop Header + Poster */}
                <div className="p-8 flex flex-col h-full overflow-hidden">
                  {/* Desktop Header */}
                  <header className="flex items-center justify-between mb-6 shrink-0">
                    <button
                      onClick={handleHomeClick}
                      className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      <span>마이 스튜디오</span>
                    </button>
                    <div className="text-center">
                      <p className="text-xs text-white/50">STEP 3 OF 3</p>
                      <p className="text-sm text-white font-medium">촬영 진행 중</p>
                    </div>
                  </header>

                  {/* Poster */}
                  <div className="flex-1 min-h-0">
                    <DesktopPoster theme={selectedTheme} imageCount={12} />
                  </div>
                </div>

                {/* Right: Progress Content */}
                <div className="h-full overflow-y-auto flex flex-col">
                  {/* Desktop Right Header */}
                  <div className="flex justify-end p-6 shrink-0">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                              step <= (waitingPhase === 'learning' ? 1 : waitingPhase === 'generating' ? 2 : 3)
                                ? 'bg-white'
                                : 'bg-white/30'
                            }`}
                          />
                          {step < 3 && (
                            <div
                              className={`w-10 h-0.5 transition-colors ${
                                step < (waitingPhase === 'learning' ? 1 : waitingPhase === 'generating' ? 2 : 3)
                                  ? 'bg-white'
                                  : 'bg-white/30'
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <WaitingContent
                      phase={waitingPhase}
                      progress={progress}
                      themeName={themeName}
                      onHomeClick={handleHomeClick}
                      onCloseClick={handleCloseClick}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Layout (single column) */}
              <div className="lg:hidden">
                <WaitingContent
                  phase={waitingPhase}
                  progress={progress}
                  themeName={themeName}
                  onHomeClick={handleHomeClick}
                  onCloseClick={handleCloseClick}
                />
              </div>
            </motion.div>
          )}

          {/* Completed Phase - Show Complete Screen */}
          {phase === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Desktop Layout */}
              <div className="hidden lg:grid lg:grid-cols-2 lg:h-screen">
                {/* Left: Poster */}
                <div className="p-8 flex flex-col h-full overflow-hidden">
                  <header className="flex items-center justify-between mb-6 shrink-0">
                    <button
                      onClick={handleHomeClick}
                      className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      <span>마이 스튜디오</span>
                    </button>
                  </header>
                  <div className="flex-1 min-h-0">
                    <DesktopPoster
                      theme={selectedTheme}
                      imageCount={generation?.images?.length || 12}
                    />
                  </div>
                </div>

                {/* Right: Complete Screen */}
                <div className="h-full overflow-y-auto flex flex-col">
                  {/* Desktop Right Header */}
                  <div className="flex justify-end p-6 shrink-0">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          {step < 3 && (
                            <div className="w-10 h-0.5 bg-white" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1">
                    <CompleteScreen
                      images={generation?.images || []}
                      themeName={themeName}
                      onViewResults={handleViewResults}
                      onShare={handleShare}
                      onHomeClick={handleHomeClick}
                      onCloseClick={handleCloseClick}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden">
                <CompleteScreen
                  images={generation?.images || []}
                  themeName={themeName}
                  onViewResults={handleViewResults}
                  onShare={handleShare}
                  onHomeClick={handleHomeClick}
                  onCloseClick={handleCloseClick}
                />
              </div>
            </motion.div>
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
