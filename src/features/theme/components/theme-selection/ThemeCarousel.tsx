'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DarkThemeCard } from './DarkThemeCard';
import type { ThemeWithUI } from '../../types';

interface ThemeCarouselProps {
  themes: ThemeWithUI[];
  selectedThemeId: string | null;
  faceOverlay: boolean;
  onSelect: (themeId: string) => void;
  onViewSamples: (theme: ThemeWithUI) => void;
}

export function ThemeCarousel({
  themes,
  selectedThemeId,
  faceOverlay,
  onSelect,
  onViewSamples,
}: ThemeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.scrollWidth / themes.length;
    const newIndex = Math.round(scrollLeft / itemWidth);

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < themes.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, themes.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (themes.length === 0) {
    return null;
  }

  return (
    <div data-testid="theme-carousel" className="md:hidden">
      {/* Carousel Scroll Container */}
      <div
        ref={scrollContainerRef}
        data-testid="carousel-scroll"
        className={cn(
          'flex gap-4 px-4 pb-4',
          'overflow-x-auto snap-x snap-mandatory',
          'scrollbar-hide'
        )}
      >
        {themes.map((theme, index) => (
          <div
            key={theme.id}
            className="flex-shrink-0 w-[280px] snap-center"
          >
            <DarkThemeCard
              theme={theme}
              isSelected={selectedThemeId === theme.id}
              faceOverlay={faceOverlay}
              onSelect={() => onSelect(theme.id)}
              onViewSamples={() => onViewSamples(theme)}
            />
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {themes.map((theme, index) => (
          <div
            key={theme.id}
            data-testid="dot-indicator"
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              index === activeIndex ? 'bg-white' : 'bg-white/40'
            )}
          />
        ))}
      </div>
    </div>
  );
}
