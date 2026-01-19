'use client';

import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Download, ChevronLeft, ChevronRight, Share2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationImage } from '@/features/generation/types';

export interface ImageLightboxProps {
  images: GenerationImage[];
  currentIndex: number | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (index: number) => void;
  onShare?: () => void;
  onRegenerate?: () => void;
  onNavigate: (index: number) => void;
  remainingRegens?: number;
  className?: string;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onRegenerate,
  onNavigate,
  remainingRegens = 0,
  className,
}: ImageLightboxProps) {
  const currentImage = currentIndex !== null ? images[currentIndex] : null;
  const totalImages = images.length;
  const hasPrev = currentIndex !== null && currentIndex > 0;
  const hasNext = currentIndex !== null && currentIndex < totalImages - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && currentIndex !== null) {
      onNavigate(currentIndex - 1);
    }
  }, [hasPrev, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext && currentIndex !== null) {
      onNavigate(currentIndex + 1);
    }
  }, [hasNext, currentIndex, onNavigate]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    },
    [onClose, handlePrev, handleNext]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || currentIndex === null || !currentImage) {
    return null;
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      <motion.div
        data-testid="lightbox-overlay"
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-slate-950/95',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-4 py-4 shrink-0">
          <button
            data-testid="lightbox-close-button"
            aria-label="닫기"
            className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-white/80 text-sm font-medium">
            {currentIndex + 1} / {totalImages}
          </div>

          <div className="w-10" />
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div
          className="flex-1 flex items-center justify-center px-4 min-h-0"
          onClick={handleContentClick}
        >
          {/* 이전 버튼 */}
          <button
            aria-label="이전 이미지"
            disabled={!hasPrev}
            className={cn(
              'absolute left-4 z-10',
              'w-12 h-12 rounded-full',
              'flex items-center justify-center',
              'transition-all duration-200',
              hasPrev
                ? 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* 이미지 */}
          <motion.div
            key={currentIndex}
            className="relative w-full max-w-2xl aspect-[3/4] overflow-hidden rounded-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              data-testid="lightbox-image"
              src={currentImage.url}
              alt={`화보 이미지 ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
            />
          </motion.div>

          {/* 다음 버튼 */}
          <button
            aria-label="다음 이미지"
            disabled={!hasNext}
            className={cn(
              'absolute right-4 z-10',
              'w-12 h-12 rounded-full',
              'flex items-center justify-center',
              'transition-all duration-200',
              hasNext
                ? 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* 하단 액션 바 */}
        <div
          className="shrink-0 px-4 py-6"
          onClick={handleContentClick}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {/* 저장 버튼 */}
            <button
              data-testid="lightbox-download-button"
              aria-label="저장"
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full',
                'bg-white text-slate-900',
                'font-medium text-sm whitespace-nowrap',
                'transition-colors hover:bg-white/90'
              )}
              onClick={() => onDownload(currentIndex)}
            >
              <Download className="h-4 w-4 shrink-0" />
              저장
            </button>

            {/* 공유 버튼 */}
            {onShare && (
              <button
                aria-label="공유"
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full',
                  'bg-white/10 backdrop-blur-sm text-white',
                  'font-medium text-sm whitespace-nowrap',
                  'transition-colors hover:bg-white/20'
                )}
                onClick={onShare}
              >
                <Share2 className="h-4 w-4 shrink-0" />
                공유
              </button>
            )}

            {/* 재생성 버튼 */}
            {onRegenerate && (
              <button
                aria-label="재생성"
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full',
                  'bg-white/10 backdrop-blur-sm text-white',
                  'font-medium text-sm whitespace-nowrap',
                  'transition-colors hover:bg-white/20'
                )}
                onClick={onRegenerate}
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                재생성
                {remainingRegens > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-xs">
                    {remainingRegens}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
