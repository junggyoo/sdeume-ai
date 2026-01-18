'use client';

import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationImage } from '@/features/generation/types';

export interface ImageLightboxProps {
  image: GenerationImage | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  className?: string;
}

export function ImageLightbox({
  image,
  isOpen,
  onClose,
  onDownload,
  className,
}: ImageLightboxProps) {
  // ESC 키 핸들러
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // 렌더링하지 않을 조건
  if (!isOpen || !image) {
    return null;
  }

  // 컨텐츠 영역 클릭 시 이벤트 전파 중지
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
          'fixed inset-0 z-50 flex items-center justify-center bg-black/80',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* 닫기 버튼 */}
        <button
          data-testid="lightbox-close-button"
          aria-label="닫기"
          className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-6 w-6" />
        </button>

        {/* 이미지 컨테이너 */}
        <div
          data-testid="lightbox-content"
          className="relative flex flex-col items-center"
          onClick={handleContentClick}
        >
          {/* 이미지 */}
          <motion.div
            className="relative aspect-[4/5] h-[80vh] overflow-hidden rounded-image"
            layoutId={`image-${image.url}`}
          >
            <Image
              data-testid="lightbox-image"
              src={image.url}
              alt="화보 이미지"
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </motion.div>

          {/* 다운로드 버튼 */}
          <button
            data-testid="lightbox-download-button"
            aria-label="다운로드"
            className="mt-4 flex items-center gap-2 rounded-input bg-white px-6 py-3 font-sans text-sm font-semibold text-primary-desktop transition-colors hover:bg-secondary"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
            다운로드
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
