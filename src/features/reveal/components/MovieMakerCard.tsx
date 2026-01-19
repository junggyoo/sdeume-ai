'use client';

import { Film, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MovieMakerCardProps {
  imageCount: number;
  duration?: number;
  onCreateMovie: () => void;
  disabled?: boolean;
  isSupported?: boolean;
  className?: string;
}

export function MovieMakerCard({
  imageCount,
  duration = 15,
  onCreateMovie,
  disabled = false,
  isSupported = true,
  className,
}: MovieMakerCardProps) {
  const isDisabled = disabled || !isSupported;

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'aspect-[3/4]',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-br from-purple-500/50 via-pink-500/50 to-amber-500/50',
          'animate-[gradient-shift_4s_ease_infinite]',
          'bg-[length:200%_200%]'
        )}
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      <div
        className={cn(
          'absolute inset-[1.5px] rounded-2xl',
          'bg-slate-900/80 backdrop-blur-xl',
          'flex flex-col items-center justify-center',
          'p-4 text-center'
        )}
      >
        <div className="relative mb-3">
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse" />
          <div
            className={cn(
              'w-14 h-14 rounded-xl',
              'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
              'flex items-center justify-center'
            )}
          >
            <Film className="w-7 h-7 text-purple-400" />
          </div>
        </div>

        <h3 className="text-white font-semibold text-base mb-1">
          {duration}초 무비
        </h3>

        <p className="text-white/60 text-xs mb-4">
          {imageCount}장의 사진으로
          <br />
          영상을 만들어보세요
        </p>

        <button
          onClick={onCreateMovie}
          disabled={isDisabled}
          className={cn(
            'flex items-center gap-2',
            'px-4 py-2 rounded-full',
            'text-sm font-medium',
            'transition-all duration-200',
            isDisabled
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 active:scale-95'
          )}
        >
          무비 만들기
          <ArrowRight className="w-4 h-4" />
        </button>

        {!isSupported && (
          <p className="text-xs text-slate-500 mt-2">
            브라우저 미지원
          </p>
        )}
      </div>
    </div>
  );
}
