'use client';

import { cn } from '@/lib/utils';
import type { QueuedFile } from '@/features/upload/types';
import type { CropMode } from '../types';
import { ZoomIn, ZoomOut, Image } from 'lucide-react';

interface OptimizedImage extends QueuedFile {
  cropMode: CropMode;
}

interface MosaicGridProps {
  images: OptimizedImage[];
  onToggleCrop: (id: string, currentMode: CropMode) => void;
  className?: string;
}

export function MosaicGrid({ images, onToggleCrop, className }: MosaicGridProps) {
  if (images.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        업로드된 이미지가 없습니다
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2',
        className
      )}
    >
      {images.map((image, index) => (
        <MosaicItem
          key={image.id}
          image={image}
          index={index}
          onToggleCrop={onToggleCrop}
        />
      ))}
    </div>
  );
}

interface MosaicItemProps {
  image: OptimizedImage;
  index: number;
  onToggleCrop: (id: string, currentMode: CropMode) => void;
}

function MosaicItem({ image, index, onToggleCrop }: MosaicItemProps) {
  const { cropMode } = image;

  // Create varied sizes for visual interest
  const isLarge = index % 5 === 0;
  const isWide = index % 7 === 0 && !isLarge;

  const getCropIcon = () => {
    switch (cropMode) {
      case 'face':
        return <ZoomIn className="w-4 h-4 text-primary-desktop" />;
      case 'body':
        return <ZoomOut className="w-4 h-4 text-accent-teal" />;
      default:
        return <Image className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNextModeLabel = () => {
    switch (cropMode) {
      case 'original':
        return '얼굴로';
      case 'face':
        return '상반신으로';
      case 'body':
        return '원본으로';
    }
  };

  return (
    <div
      className={cn(
        'relative group rounded-lg overflow-hidden cursor-pointer',
        'transition-transform hover:scale-[1.02]',
        isLarge && 'col-span-2 row-span-2',
        isWide && 'col-span-2'
      )}
      onClick={() => onToggleCrop(image.id, cropMode)}
    >
      {/* Image */}
      {image.previewUrl && (
        <img
          src={image.previewUrl}
          alt=""
          className={cn(
            'w-full h-full object-cover',
            isLarge ? 'aspect-square' : 'aspect-[4/3]'
          )}
        />
      )}

      {/* Bucket Badge */}
      {image.analysis && (
        <div
          className={cn(
            'absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium text-white',
            image.analysis.bucket === 'A' && 'bg-accent-teal',
            image.analysis.bucket === 'B' && 'bg-accent-rose',
            image.analysis.bucket === 'C' && 'bg-gray-500'
          )}
        >
          {image.analysis.bucket}
        </div>
      )}

      {/* Crop Mode Badge (always visible when not original) */}
      {cropMode !== 'original' && (
        <div
          className={cn(
            'absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium text-white',
            cropMode === 'face' && 'bg-primary-desktop',
            cropMode === 'body' && 'bg-accent-teal'
          )}
        >
          {cropMode === 'face' ? '얼굴' : '상반신'}
        </div>
      )}

      {/* Crop Mode Indicator */}
      <div
        className={cn(
          'absolute bottom-2 right-2 p-1.5 rounded-full',
          'bg-white/80 backdrop-blur-sm',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        {getCropIcon()}
      </div>

      {/* Hover Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/20',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'flex items-center justify-center'
        )}
      >
        <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
          {getNextModeLabel()}
        </span>
      </div>
    </div>
  );
}
