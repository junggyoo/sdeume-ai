'use client';

import { cn } from '@/lib/utils';
import type { GenerationImage } from '@/features/generation/types';
import { PhotoCard } from './PhotoCard';
import { MovieMakerCard } from './MovieMakerCard';

export interface PhotoGridProps {
  images: GenerationImage[];
  selectedIds: Set<number>;
  selectionMode: boolean;
  onSelectImage: (index: number) => void;
  onImageClick: (index: number) => void;
  onCreateMovie: () => void;
  isMovieSupported?: boolean;
  isMovieProcessing?: boolean;
  className?: string;
}

export function PhotoGrid({
  images,
  selectedIds,
  selectionMode,
  onSelectImage,
  onImageClick,
  onCreateMovie,
  isMovieSupported = true,
  isMovieProcessing = false,
  className,
}: PhotoGridProps) {
  return (
    <div
      className={cn(
        'columns-2 md:columns-3 lg:columns-4',
        'gap-3 md:gap-4',
        className
      )}
    >
      <div className="break-inside-avoid mb-3 md:mb-4">
        <MovieMakerCard
          imageCount={images.length}
          onCreateMovie={onCreateMovie}
          isSupported={isMovieSupported}
          disabled={isMovieProcessing}
        />
      </div>

      {images.map((image, index) => (
        <div key={`${image.url}-${index}`} className="break-inside-avoid mb-3 md:mb-4">
          <PhotoCard
            image={image}
            index={index}
            isSelected={selectedIds.has(index)}
            selectionMode={selectionMode}
            onSelect={onSelectImage}
            onClick={onImageClick}
          />
        </div>
      ))}
    </div>
  );
}
