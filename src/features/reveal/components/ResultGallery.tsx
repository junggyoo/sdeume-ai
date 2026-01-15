'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Download, ImageOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationImage } from '@/features/generation/types';
import { GALLERY_ANIMATION } from '../constants';

export interface ResultGalleryProps {
  images: GenerationImage[];
  onImageClick: (image: GenerationImage, index: number) => void;
  onDownload: (image: GenerationImage) => void;
  onDownloadAll: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ResultGallery({
  images,
  onImageClick,
  onDownload,
  onDownloadAll,
  isLoading = false,
  className,
}: ResultGalleryProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div
        data-testid="gallery-loading"
        className="flex flex-col items-center justify-center py-20"
      >
        <Loader2 className="h-8 w-8 animate-spin text-accent-rose" />
        <p className="mt-4 text-sm text-gray-500">화보를 불러오는 중...</p>
      </div>
    );
  }

  // 빈 상태
  if (images.length === 0) {
    return (
      <div
        data-testid="gallery-empty"
        className="flex flex-col items-center justify-center py-20"
      >
        <ImageOff className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">생성된 이미지가 없습니다.</p>
      </div>
    );
  }

  const heroImage = images[0];
  const gridImages = images.slice(1);

  return (
    <motion.div
      data-testid="result-gallery"
      className={cn('space-y-6', className)}
      {...GALLERY_ANIMATION}
    >
      {/* Hero 섹션 - 첫 번째 이미지 */}
      <section data-testid="gallery-hero" className="relative">
        <button
          data-testid="gallery-hero-button"
          aria-label="이미지 1 크게 보기"
          className="group relative block w-full overflow-hidden rounded-card shadow-sm transition-shadow hover:shadow-md"
          onClick={() => onImageClick(heroImage, 0)}
        >
          <div className="relative aspect-[4/5]">
            <Image
              data-testid="gallery-image-0"
              src={heroImage.url}
              alt="화보 이미지 1"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10" />
        </button>
        {/* 다운로드 버튼 */}
        <button
          data-testid="gallery-download-button-0"
          aria-label="이미지 1 다운로드"
          className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(heroImage);
          }}
        >
          <Download className="h-4 w-4 text-primary-desktop" />
        </button>
      </section>

      {/* Masonry 그리드 - 나머지 이미지 */}
      {gridImages.length > 0 && (
        <section
          data-testid="gallery-masonry"
          className="columns-2 gap-4 md:columns-3"
        >
          {gridImages.map((image, idx) => {
            const actualIndex = idx + 1; // Hero가 0번이므로
            return (
              <div
                key={image.url}
                className="mb-4 break-inside-avoid"
              >
                <div className="relative">
                  <button
                    data-testid={`gallery-item-button-${actualIndex}`}
                    aria-label={`이미지 ${actualIndex + 1} 크게 보기`}
                    className="group relative block w-full overflow-hidden rounded-image shadow-sm transition-shadow hover:shadow-md"
                    onClick={() => onImageClick(image, actualIndex)}
                  >
                    <div className="relative aspect-[4/5]">
                      <Image
                        data-testid={`gallery-image-${actualIndex}`}
                        src={image.url}
                        alt={`화보 이미지 ${actualIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10" />
                  </button>
                  {/* 다운로드 버튼 */}
                  <button
                    data-testid={`gallery-download-button-${actualIndex}`}
                    aria-label={`이미지 ${actualIndex + 1} 다운로드`}
                    className="absolute bottom-2 right-2 rounded-full bg-white/90 p-1.5 shadow-sm opacity-0 transition-all group-hover:opacity-100 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(image);
                    }}
                  >
                    <Download className="h-3.5 w-3.5 text-primary-desktop" />
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 전체 다운로드 버튼 */}
      <div className="flex justify-center pt-4">
        <button
          data-testid="gallery-download-all-button"
          aria-label="모든 이미지 다운로드"
          className="flex items-center gap-2 rounded-input border border-primary-desktop/20 bg-white px-6 py-3 font-sans text-sm font-semibold text-primary-desktop transition-colors hover:bg-secondary"
          onClick={onDownloadAll}
        >
          <Download className="h-4 w-4" />
          전체 다운로드 ({images.length}장)
        </button>
      </div>
    </motion.div>
  );
}
