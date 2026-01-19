'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationImage } from '@/features/generation/types';

const ASPECT_RATIOS = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[9/14]'] as const;

export interface PhotoCardProps {
  image: GenerationImage;
  index: number;
  isSelected: boolean;
  selectionMode: boolean;
  onSelect: (index: number) => void;
  onClick: (index: number) => void;
  className?: string;
}

export function PhotoCard({
  image,
  index,
  isSelected,
  selectionMode,
  onSelect,
  onClick,
  className,
}: PhotoCardProps) {
  const aspectRatioClass = ASPECT_RATIOS[index % ASPECT_RATIOS.length];

  const handleClick = () => {
    if (selectionMode) {
      onSelect(index);
    } else {
      onClick(index);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(index);
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1.5 hover:scale-[1.02]',
        'hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3)]',
        className
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-slate-800',
          aspectRatioClass
        )}
      >
        <Image
          src={image.url}
          alt={`화보 이미지 ${index + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        <div
          className={cn(
            'absolute inset-0 transition-colors duration-200',
            selectionMode && isSelected
              ? 'bg-black/30'
              : 'bg-transparent group-hover:bg-black/10'
          )}
        />

        {selectionMode && (
          <button
            onClick={handleCheckboxClick}
            className={cn(
              'absolute top-3 right-3 z-10',
              'w-6 h-6 rounded-full',
              'flex items-center justify-center',
              'transition-all duration-200',
              'border-2',
              isSelected
                ? 'bg-amber-400 border-amber-400'
                : 'bg-white/20 border-white/60 backdrop-blur-sm'
            )}
            aria-label={isSelected ? '선택 해제' : '선택'}
          >
            {isSelected && <Check className="w-4 h-4 text-slate-900" />}
          </button>
        )}

        <div
          className={cn(
            'absolute bottom-2 left-2',
            'text-white/60 text-sm font-medium',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}
        >
          {index + 1}
        </div>
      </div>
    </div>
  );
}
