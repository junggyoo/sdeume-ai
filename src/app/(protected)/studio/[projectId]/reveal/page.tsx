'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

import { useProject } from '@/features/project/hooks/useProject';
import { useProjectGeneration } from '@/features/generation/hooks/useProjectGeneration';
import { useGenerationJob } from '@/features/generation/hooks/useGenerationJob';
import {
  WaxSealEnvelope,
  ResultGallery,
  ImageLightbox,
  RerollButton,
  MovieGeneratorBtn,
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
import type { GenerationImage } from '@/features/generation/types';

export default function RevealPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const { toast } = useToast();

  // 프로젝트 데이터
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);

  // Generation 데이터
  const { generation: projectGeneration, isLoading: isGenerationLoading } =
    useProjectGeneration(projectId);

  const generationId = projectGeneration?.id ?? '';

  // Generation Job 상태 (completed 상태에서는 폴링 없음)
  const { generation: rawGeneration, isLoading: isJobLoading } = useGenerationJob(generationId, {
    enabled: Boolean(generationId),
  });

  // 중복 URL 제거 (이전 버그로 인해 같은 URL이 여러 번 저장된 경우 대응)
  const generation = rawGeneration
    ? {
        ...rawGeneration,
        images: rawGeneration.images.filter(
          (image, index, self) =>
            index === self.findIndex((img) => img.url === image.url)
        ),
      }
    : undefined;

  // 로컬 상태
  const [isOpened, setIsOpened] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GenerationImage | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 영상 생성 훅 (이미지 URL 배열 전달)
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

  // 영상 생성 에러 표시
  useEffect(() => {
    if (movieError) {
      console.error('Movie generation error:', movieError.message);
      toast({
        variant: 'destructive',
        title: '영상 생성 실패',
        description: movieError.message,
      });
    }
  }, [movieError, toast]);

  // 로딩 상태 통합
  const isLoading = isProjectLoading || isGenerationLoading || isJobLoading;

  // 이미지 클릭 핸들러
  const handleImageClick = useCallback((image: GenerationImage) => {
    setSelectedImage(image);
  }, []);

  // Lightbox 닫기
  const handleCloseLightbox = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // 단일 이미지 다운로드
  const handleDownloadSingle = useCallback(
    async (image: GenerationImage) => {
      const images = generation?.images ?? [];
      const index = images.findIndex((img) => img.url === image.url);
      const filename = generateFilename(index, projectId);
      try {
        await downloadImage(image.url, filename);
      } catch (error) {
        console.error('Download failed:', error);
      }
    },
    [generation?.images, projectId]
  );

  // 전체 다운로드
  const handleDownloadAll = useCallback(async () => {
    if (!generation?.images || isDownloading) return;

    setIsDownloading(true);
    try {
      const result = await downloadAllImages(generation.images, projectId);
      console.log(`Downloaded ${result.successCount} images, ${result.failedCount} failed`);
    } catch (error) {
      console.error('Bulk download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [generation?.images, projectId, isDownloading]);

  // 봉투 열기
  const handleOpen = useCallback(() => {
    setIsOpened(true);
  }, []);

  // 봉투 열기 완료
  const handleOpenComplete = useCallback(() => {
    // 애니메이션 완료 후 추가 작업이 필요하면 여기서 처리
  }, []);

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        data-testid="reveal-loading"
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <Loader2 className="h-8 w-8 animate-spin text-accent-rose" />
        <p className="mt-4 text-sm text-gray-500">화보를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 상태 (generation이 없음)
  if (!generation || !generation.images || generation.images.length === 0) {
    return (
      <div
        data-testid="reveal-error"
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <p className="text-gray-500">화보를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-gray-400">
          촬영이 완료되지 않았거나 문제가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 봉투 단계 */}
      <AnimatePresence mode="wait">
        {!isOpened && (
          <motion.div
            key="envelope"
            data-testid="reveal-envelope"
            className="flex flex-col items-center justify-center min-h-[60vh] py-12"
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
            {/* 헤더 텍스트 */}
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl font-bold text-primary-desktop">
                기다림 끝, 화보가 도착했어요
              </h2>
              <p className="mt-2 text-gray-600">
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

      {/* 갤러리 단계 */}
      <AnimatePresence>
        {isOpened && (
          <motion.div
            key="gallery"
            data-testid="reveal-gallery"
            className="py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: REVEAL_TIMING.galleryFade / 1000,
              delay: 0.1,
            }}
          >
            {/* 헤더 텍스트 */}
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl font-bold text-primary-desktop">
                당신만의 화보가 완성되었어요
              </h2>
              <p className="mt-2 text-gray-600">
                {generation.images.length}장의 특별한 순간을 확인하세요
              </p>
            </div>

            {/* 갤러리 */}
            <ResultGallery
              images={generation.images}
              onImageClick={handleImageClick}
              onDownload={handleDownloadSingle}
              onDownloadAll={handleDownloadAll}
              isLoading={isDownloading}
            />

            {/* 영상 생성 버튼 */}
            <div className="flex justify-center mt-6">
              <MovieGeneratorBtn
                onClick={generateMovie}
                disabled={isMovieProcessing}
                isSupported={isMovieSupported}
              />
            </div>

            {/* Re-roll 버튼 */}
            <div className="flex justify-center mt-8">
              <RerollButton remainingCount={1} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <ImageLightbox
        image={selectedImage}
        isOpen={!!selectedImage}
        onClose={handleCloseLightbox}
        onDownload={() => selectedImage && handleDownloadSingle(selectedImage)}
      />

      {/* 영상 생성 모달 */}
      <MovieProcessingModal
        isOpen={isProcessingModalOpen}
        progress={movieProgress}
        onCancel={cancelGeneration}
      />

      {/* 영상 미리보기 모달 */}
      <MoviePreviewModal
        isOpen={isPreviewModalOpen}
        videoUrl={videoUrl}
        onClose={closePreviewModal}
        onDownload={downloadVideo}
      />
    </div>
  );
}
