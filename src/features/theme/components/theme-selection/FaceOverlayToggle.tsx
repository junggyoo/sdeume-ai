'use client';

import { Eye, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceOverlayToggleProps {
  enabled: boolean;
  onToggle: () => void;
  variant?: 'default' | 'fab' | 'header';
}

export function FaceOverlayToggle({
  enabled,
  onToggle,
  variant = 'default',
}: FaceOverlayToggleProps) {
  if (variant === 'fab') {
    return (
      <button
        onClick={onToggle}
        aria-pressed={enabled}
        className={cn(
          'fixed bottom-24 right-4 z-40',
          'w-12 h-12 rounded-full shadow-lg',
          'flex items-center justify-center',
          'transition-colors',
          enabled
            ? 'bg-amber-400/20 text-amber-400'
            : 'bg-white/10 text-white/60 backdrop-blur-sm'
        )}
      >
        <Eye className="w-5 h-5" data-testid="eye-icon" />
      </button>
    );
  }

  if (variant === 'header') {
    return (
      <button
        onClick={onToggle}
        aria-pressed={enabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'transition-colors',
          enabled ? 'bg-purple-600 text-white' : 'bg-slate-700 text-white/70'
        )}
      >
        <Wand2 className="w-4 h-4" data-testid="wand-icon" />
        <span className="text-sm font-medium">
          {enabled ? '적용됨' : '내 얼굴'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg',
        'transition-colors',
        enabled
          ? 'bg-amber-400/20 text-amber-400'
          : 'bg-white/10 text-white/60'
      )}
    >
      <Eye className="w-4 h-4" data-testid="eye-icon" />
      <span className="text-sm font-medium">내 얼굴 적용</span>
    </button>
  );
}
