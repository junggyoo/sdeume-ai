'use client';

import { Check, Sparkles, Play, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThemeWithUI } from '../../types';

interface DarkThemeCardProps {
  theme: ThemeWithUI;
  isSelected: boolean;
  faceOverlay: boolean;
  onSelect: () => void;
  onViewSamples: () => void;
}

export function DarkThemeCard({
  theme,
  isSelected,
  faceOverlay,
  onSelect,
  onViewSamples,
}: DarkThemeCardProps) {
  const handleSampleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewSamples();
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewSamples();
  };

  return (
    <div
      data-testid="theme-card"
      onClick={onSelect}
      className={cn(
        'relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer',
        'transition-all duration-300',
        theme.ui.bgColor,
        isSelected && 'ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-900 scale-[1.02]'
      )}
    >
      {/* Left Top Badge: Face Overlay or AI Recommendation */}
      {faceOverlay ? (
        <div
          data-testid="face-overlay-badge"
          className={cn(
            'absolute top-3 left-3 z-10',
            'px-3 py-1.5 rounded-full',
            'bg-purple-600',
            'flex items-center gap-1.5'
          )}
        >
          <Eye className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-semibold text-white">내 얼굴 적용</span>
        </div>
      ) : (
        theme.isRecommended && (
          <div
            data-testid="ai-badge"
            className={cn(
              'absolute top-3 left-3 z-10',
              'px-3 py-1.5 rounded-full',
              'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
              'flex items-center gap-1.5'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">AI 추천</span>
          </div>
        )
      )}

      {/* Right Top: Check Icon (selected) or Play Button (not selected) */}
      {isSelected ? (
        <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
          <Check
            className="w-5 h-5 text-slate-900"
            data-testid="check-icon"
          />
        </div>
      ) : (
        <button
          data-testid="play-button"
          onClick={handlePlayClick}
          className={cn(
            'absolute top-3 right-3 z-10',
            'w-8 h-8 rounded-full',
            'bg-white/20 backdrop-blur-sm',
            'flex items-center justify-center',
            'hover:bg-white/30 transition-colors'
          )}
        >
          <Play className="w-4 h-4 text-white fill-white" />
        </button>
      )}

      {/* Content Area */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Text Content */}
        <div className="relative z-10 text-white">
          {/* Recommend Text */}
          {theme.ui.recommendText && (
            <p className="text-xs text-amber-300 font-medium mb-1">
              {theme.ui.recommendText}
            </p>
          )}

          {/* English Name */}
          <p className="text-xs text-white/70 uppercase tracking-wider">
            {theme.ui.nameEn}
          </p>

          {/* Korean Name */}
          <h3 className="text-xl font-bold mt-0.5">{theme.name}</h3>

          {/* Tagline */}
          <p className="text-sm text-white/80 mt-1">{theme.ui.tagline}</p>

          {/* Sample View Button */}
          <button
            data-testid="sample-button"
            onClick={handleSampleClick}
            className={cn(
              'mt-3 w-full py-2.5 rounded-lg',
              'bg-black/30 backdrop-blur-md',
              'text-sm font-medium text-white',
              'flex items-center justify-center gap-2',
              'hover:bg-black/40 transition-colors'
            )}
          >
            샘플 12종 보기
          </button>
        </div>
      </div>
    </div>
  );
}
