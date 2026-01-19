'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Home from 'lucide-react/dist/esm/icons/home';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

import { useProject } from '@/features/project/hooks/useProject';
import { useProjectGeneration } from '@/features/generation/hooks/useProjectGeneration';
import { useGenerationJob } from '@/features/generation/hooks/useGenerationJob';
import { useThemes } from '@/features/theme/hooks/useThemes';
import {
  WaxSealEnvelope,
  ImageLightbox,
  PhotoGrid,
  BottomActionBar,
  ShareSheet,
  MovieProcessingModal,
  MoviePreviewModal,
} from '@/features/reveal/components';
import { useMovieMaker } from '@/features/reveal/hooks/useMovieMaker';
import {
  downloadImage,
  downloadAllImages,
  generateFilename,
} from '@/features/reveal/utils/download';
import { REVEAL_TIMING } from '@/features/reveal/constants';

export default function ResultsPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const { toast } = useToast();

  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: themes } = useThemes();
  const { generation: projectGeneration, isLoading: isGenerationLoading } =
    useProjectGeneration(projectId);

  const generationId = projectGeneration?.id ?? '';

  const { generation: rawGeneration, isLoading: isJobLoading } =
    useGenerationJob(generationId, {
      enabled: Boolean(generationId),
    });

  const generation = rawGeneration
    ? {
        ...rawGeneration,
        images: rawGeneration.images.filter(
          (image, index, self) =>
            index === self.findIndex((img) => img.url === image.url)
        ),
      }
    : undefined;

  const selectedTheme = useMemo(() => {
    if (!project?.selectedThemeId || !themes) return null;
    return themes.find((t) => t.id === project.selectedThemeId) || null;
  }, [project?.selectedThemeId, themes]);

  const themeName = selectedTheme?.name || '가든 스튜디오';

  const [isOpened, setIsOpened] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);

  const imageUrls = generation?.images?.map((img) => img.url) ?? [];
  const {
    generateMovie,
    cancelGeneration,
    downloadVideo,
    closePreviewModal,
    isProcessing: isMovieProcessing,
    progress: movieProgress,
    videoUrl,
    error: movieError,
    isSupported: isMovieSupported,
    isProcessingModalOpen,
    isPreviewModalOpen,
  } = useMovieMaker({ images: imageUrls });

  useEffect(() => {
    if (movieError) {
      toast({
        variant: 'destructive',
        title: '영상 생성 실패',
        description: movieError.message,
      });
    }
  }, [movieError, toast]);

  const isLoading = isProjectLoading || isGenerationLoading || isJobLoading;
  const images = generation?.images ?? [];

  const handleHomeClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleImageClick = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handleLightboxNavigate = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const handleDownloadSingle = useCallback(
    async (index: number) => {
      if (!images[index]) return;
      const filename = generateFilename(index, projectId);
      try {
        await downloadImage(images[index].url, filename);
        toast({
          title: '저장 완료',
          description: '이미지가 저장되었습니다.',
        });
      } catch (error) {
        console.error('Download failed:', error);
        toast({
          variant: 'destructive',
          title: '저장 실패',
          description: '이미지 저장에 실패했습니다.',
        });
      }
    },
    [images, projectId, toast]
  );

  const handleDownloadAll = useCallback(async () => {
    if (!images.length || isDownloading) return;

    setIsDownloading(true);
    try {
      const result = await downloadAllImages(images, projectId);
      toast({
        title: '저장 완료',
        description: `${result.successCount}장의 이미지가 저장되었습니다.`,
      });
    } catch (error) {
      console.error('Bulk download failed:', error);
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '이미지 저장에 실패했습니다.',
      });
    } finally {
      setIsDownloading(false);
    }
  }, [images, projectId, isDownloading, toast]);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedIds.size === 0 || isDownloading) return;

    setIsDownloading(true);
    const selectedImages = Array.from(selectedIds)
      .map((i) => images[i])
      .filter(Boolean);

    try {
      const result = await downloadAllImages(selectedImages, projectId);
      toast({
        title: '저장 완료',
        description: `${result.successCount}장의 이미지가 저장되었습니다.`,
      });
    } catch (error) {
      console.error('Selected download failed:', error);
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '이미지 저장에 실패했습니다.',
      });
    } finally {
      setIsDownloading(false);
    }
  }, [images, selectedIds, projectId, isDownloading, toast]);

  const handleSelectImage = useCallback((index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((_, i) => i)));
    }
  }, [images, selectedIds.size]);

  const handleShare = useCallback(() => {
    setIsShareSheetOpen(true);
  }, []);

  const handleRegenerate = useCallback(() => {
    toast({
      title: '준비 중',
      description: '재생성 기능은 곧 출시됩니다.',
    });
  }, [toast]);

  const handleOpen = useCallback(() => {
    setIsOpened(true);
  }, []);

  const handleOpenComplete = useCallback(() => {}, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <p className="mt-4 text-sm text-white/60">화보를 불러오는 중...</p>
      </div>
    );
  }

  if (!generation || !generation.images || generation.images.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center">
        <p className="text-white/60">화보를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-white/40">
          촬영이 완료되지 않았거나 문제가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AnimatePresence mode="wait">
        {!isOpened && (
          <motion.div
            key="envelope"
            className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center py-12 px-4"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: {
                duration: REVEAL_TIMING.galleryFade / 1000,
                delay:
                  (REVEAL_TIMING.sealBreak +
                    REVEAL_TIMING.envelopeOpen +
                    REVEAL_TIMING.lightBloom) /
                  1000,
              },
            }}
          >
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl font-bold text-white">
                기다림 끝, 화보가 도착했어요
              </h2>
              <p className="mt-2 text-white/60">
                실링을 눌러 {generation.images.length}장의 화보를 확인하세요
              </p>
            </div>

            <WaxSealEnvelope
              isOpened={isOpened}
              onOpen={handleOpen}
              onOpenComplete={handleOpenComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpened && (
          <motion.div
            key="gallery"
            className="pb-28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: REVEAL_TIMING.galleryFade / 1000,
              delay: 0.1,
            }}
          >
            <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
              <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4">

                  
                  <div className="text-center">
                    <h1 className="text-white font-semibold">Your Moments</h1>
                    <p className="text-white/60 text-xs truncate">
                      {themeName}에서 촬영한 {generation.images.length}장의 화보
                    </p>
                  </div>

                  <button
                    onClick={handleRegenerate}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-400 text-sm font-medium hover:bg-amber-400/30 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">재생성</span>
                    <span className="font-bold">3</span>
                  </button>
                </div>
              </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
              <PhotoGrid
                images={images}
                selectedIds={selectedIds}
                selectionMode={selectionMode}
                onSelectImage={handleSelectImage}
                onImageClick={handleImageClick}
                onCreateMovie={generateMovie}
                isMovieSupported={isMovieSupported}
                isMovieProcessing={isMovieProcessing}
              />
            </main>

            <BottomActionBar
              selectionMode={selectionMode}
              selectedCount={selectedIds.size}
              totalCount={images.length}
              onToggleSelectionMode={handleToggleSelectionMode}
              onSelectAll={handleSelectAll}
              onDownloadSelected={handleDownloadSelected}
              onDownloadAll={handleDownloadAll}
              onShare={handleShare}
              isDownloading={isDownloading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ImageLightbox
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxIndex !== null}
        onClose={handleCloseLightbox}
        onDownload={handleDownloadSingle}
        onShare={handleShare}
        onRegenerate={handleRegenerate}
        onNavigate={handleLightboxNavigate}
        remainingRegens={3}
      />

      <ShareSheet
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        shareTitle={`${themeName} 화보`}
        shareText={`스드메 AI로 만든 아름다운 ${themeName} 화보를 확인하세요!`}
      />

      <MovieProcessingModal
        isOpen={isProcessingModalOpen}
        progress={movieProgress}
        onCancel={cancelGeneration}
      />

      <MoviePreviewModal
        isOpen={isPreviewModalOpen}
        videoUrl={videoUrl}
        onClose={closePreviewModal}
        onDownload={downloadVideo}
      />
    </div>
  );
}
