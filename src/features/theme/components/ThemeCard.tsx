'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, Sun, TreePine, Crown } from 'lucide-react';
import type { Theme } from '../types';
import { LookbookSheet } from './LookbookSheet';

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: (themeId: string) => void;
  className?: string;
}

// 테마별 아이콘 매핑
const THEME_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'white_studio': Sun,
  'garden_studio': TreePine,
  'classic_studio': Crown,
};

// 테마별 색상 매핑
const THEME_COLORS: Record<string, { bg: string; border: string }> = {
  'white_studio': { bg: 'bg-gray-50', border: 'border-gray-300' },
  'garden_studio': { bg: 'bg-green-50', border: 'border-green-300' },
  'classic_studio': { bg: 'bg-amber-50', border: 'border-amber-300' },
};

export function ThemeCard({ theme, isSelected, onSelect, className }: ThemeCardProps) {
  const [showLookbook, setShowLookbook] = useState(false);

  const Icon = THEME_ICONS[theme.slug] || Sun;
  const colors = THEME_COLORS[theme.slug] || { bg: 'bg-gray-50', border: 'border-gray-300' };

  // Long press for lookbook
  let pressTimer: NodeJS.Timeout | null = null;

  const handlePressStart = () => {
    pressTimer = setTimeout(() => {
      setShowLookbook(true);
    }, 500); // 500ms long press
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const handleClick = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    onSelect(theme.id);
  };

  return (
    <>
      <Card
        onClick={handleClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        className={cn(
          'p-6 cursor-pointer transition-all relative overflow-hidden',
          colors.bg,
          isSelected
            ? 'ring-2 ring-primary-desktop border-primary-desktop'
            : `border-2 ${colors.border} hover:border-primary-desktop/50`,
          className
        )}
      >
        {/* AI Recommend Badge */}
        {theme.isRecommended && (
          <Badge className="absolute top-3 right-3 bg-accent-rose text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            AI 추천
          </Badge>
        )}

        {/* Selected Check */}
        {isSelected && (
          <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary-desktop flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Theme Thumbnail or Icon */}
        <div className="flex justify-center mb-4 mt-2">
          {theme.thumbnailUrl ? (
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm">
              <img
                src={theme.thumbnailUrl}
                alt={theme.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary-desktop" />
            </div>
          )}
        </div>

        {/* Theme Info */}
        <div className="text-center">
          <h3 className="font-semibold text-primary-desktop">{theme.name}</h3>
          <p className="mt-2 text-sm text-gray-600">{theme.description}</p>
        </div>

        {/* Tags */}
        {theme.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-4">
            {theme.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Lookbook Sheet */}
      <LookbookSheet
        theme={theme}
        isOpen={showLookbook}
        onClose={() => setShowLookbook(false)}
        onSelect={() => {
          onSelect(theme.id);
          setShowLookbook(false);
        }}
      />
    </>
  );
}
