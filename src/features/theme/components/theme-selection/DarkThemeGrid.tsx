'use client';

import { cn } from '@/lib/utils';
import { DarkThemeCard } from './DarkThemeCard';
import type { ThemeWithUI } from '../../types';

interface DarkThemeGridProps {
  themes: ThemeWithUI[];
  selectedThemeId: string | null;
  faceOverlay: boolean;
  onSelect: (themeId: string) => void;
  onViewSamples: (theme: ThemeWithUI) => void;
}

export function DarkThemeGrid({
  themes,
  selectedThemeId,
  faceOverlay,
  onSelect,
  onViewSamples,
}: DarkThemeGridProps) {
  if (themes.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="theme-grid"
      className={cn('hidden md:grid grid-cols-3 gap-5')}
    >
      {themes.map((theme) => (
        <DarkThemeCard
          key={theme.id}
          theme={theme}
          isSelected={selectedThemeId === theme.id}
          faceOverlay={faceOverlay}
          onSelect={() => onSelect(theme.id)}
          onViewSamples={() => onViewSamples(theme)}
        />
      ))}
    </div>
  );
}
