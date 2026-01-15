'use client';

import { cn } from '@/lib/utils';
import type { Theme } from '../types';
import { ThemeCard } from './ThemeCard';

interface ThemeGridProps {
  themes: Theme[];
  selectedThemeId: string | null;
  onSelect: (themeId: string) => void;
  className?: string;
}

export function ThemeGrid({
  themes,
  selectedThemeId,
  onSelect,
  className,
}: ThemeGridProps) {
  if (themes.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        사용 가능한 테마가 없습니다
      </div>
    );
  }

  return (
    <div className={cn('grid md:grid-cols-3 gap-4', className)}>
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isSelected={selectedThemeId === theme.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
