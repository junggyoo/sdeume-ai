'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeaturedThemeWidgetProps } from '../types';
import { ATELIER_COPY } from '../constants';

export function FeaturedThemeWidget({
  themeName,
  description,
  image,
  onClick,
}: FeaturedThemeWidgetProps) {
  const bgImage =
    image ||
    'https://images.unsplash.com/photo-1546193430-c2d207739ed7?q=80&w=800&fit=crop';

  return (
    <div
      data-testid="featured-theme-widget"
      onClick={onClick}
      className="relative w-full aspect-[3/4] rounded-[32px] overflow-hidden group cursor-pointer shadow-lg"
    >
      {/* Background Image */}
      <img
        src={bgImage}
        alt={themeName}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

      {/* Editor's Pick Badge */}
      <div className="absolute top-5 left-5 z-10">
        <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest shadow-sm">
          {ATELIER_COPY.widgets.featuredTheme.badge}
        </span>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <h4 className="text-2xl font-serif text-white mb-2 leading-tight drop-shadow-md">
          {themeName}
        </h4>
        <p className="text-xs text-gray-300 line-clamp-2 mb-4 font-light">
          {description || '왕실 웨딩의 품격을 담아보세요.'}
        </p>

        <button
          type="button"
          className={cn(
            'w-full py-3 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider',
            'hover:bg-purple-50 transition-all transform translate-y-2 opacity-0',
            'group-hover:translate-y-0 group-hover:opacity-100 duration-300',
            'flex items-center justify-center gap-2 shadow-lg'
          )}
        >
          {ATELIER_COPY.widgets.featuredTheme.cta}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
