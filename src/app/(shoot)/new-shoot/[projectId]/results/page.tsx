'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Download from 'lucide-react/dist/esm/icons/download';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

import { useProject } from '@/features/project/hooks/useProject';
import { useProjectGeneration } from '@/features/generation/hooks/useProjectGeneration';
import { useGenerationJob } from '@/features/generation/hooks/useGenerationJob';
import { useThemes } from '@/features/theme/hooks/useThemes';
import {
  ImageLightbox,
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

const containerVar = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVar = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 50 },
  },
};

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

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);

  const imageUrls = generation?.images?.map((img) => img.url) ?? [];
  const {
    cancelGeneration,
    downloadVideo,
    closePreviewModal,
    progress: movieProgress,
    videoUrl,
    error: movieError,
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

  const handleRestart = useCallback(() => {
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

  const handleShare = useCallback(() => {
    setIsShareSheetOpen(true);
  }, []);

  const handleRegenerate = useCallback(() => {
    toast({
      title: '준비 중',
      description: '재생성 기능은 곧 출시됩니다.',
    });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#FAFAFA] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-500">화보를 불러오는 중...</p>
      </div>
    );
  }

  if (!generation || !generation.images || generation.images.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#FAFAFA] flex flex-col items-center justify-center">
        <p className="text-gray-500">화보를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-gray-400">
          촬영이 완료되지 않았거나 문제가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] px-6 pt-24 pb-40">
      <div className="py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest mb-2">
          <CheckCircle2 size={12} /> Session Complete
        </div>
        <h1 className="text-4xl md:text-6xl font-serif text-gray-900 leading-tight">
          Your Masterpiece <br /> Collection.
        </h1>
        <p className="text-gray-500">
          {images.length} beautiful moments captured by AI.
        </p>
      </motion.div>

      {/* Masonry Gallery */}
      <motion.div
        variants={containerVar}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
      >
        {images.map((photo, index) => (
          <motion.div
            key={`${photo.url}-${index}`}
            variants={itemVar}
            className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-shadow bg-gray-100"
          >
            <img
              src={photo.url}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
              alt={`화보 ${index + 1}`}
              onClick={() => handleImageClick(index)}
            />

            {/* Hover Overlay */}
            <div
              className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]"
              onClick={() => handleImageClick(index)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadSingle(index);
                }}
                className="p-3 bg-white/90 rounded-full text-black hover:scale-110 transition-transform shadow-lg"
                aria-label="다운로드"
              >
                <Download size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="p-3 bg-white/90 rounded-full text-black hover:scale-110 transition-transform shadow-lg"
                aria-label="공유"
              >
                <Share2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
      </div>

      {/* Floating Action Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1.5, type: 'spring' }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-xl p-2 pl-6 pr-2 rounded-full shadow-2xl border border-white/50 z-50"
      >
        <div className="text-xs font-bold text-gray-500 mr-4 hidden md:block">
          {images.length} Photos Generated
        </div>
        <button
          onClick={handleRestart}
          className="px-6 py-3 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <RotateCcw size={16} /> Restart
        </button>
        <button
          onClick={handleDownloadAll}
          disabled={isDownloading}
          className="px-8 py-3 rounded-full text-sm font-bold bg-black text-white hover:scale-105 transition-transform shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> {isDownloading ? 'Saving...' : 'Download All'}
        </button>
      </motion.div>

      {/* Modals */}
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
