'use client';

import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Theme } from '@/features/theme/types';
import { getThemeUIConfig } from '@/features/theme/lib/theme-ui-config';

interface DesktopPosterProps {
  theme?: Theme | null;
  imageCount?: number;
  className?: string;
}

export function DesktopPoster({
  theme,
  imageCount = 12,
  className,
}: DesktopPosterProps) {
  const uiConfig = theme ? getThemeUIConfig(theme.slug) : null;
  const themeName = theme?.name || '스튜디오';
  const themeNameEn = uiConfig?.nameEn || 'STUDIO';
  const bgColor = uiConfig?.bgColor || 'bg-gradient-to-br from-gray-300 to-gray-100';

  return (
    <div className={cn('relative h-full', className)}>
      {/* Poster Card */}
      <div
        className={cn(
          'relative h-full rounded-3xl overflow-hidden',
          bgColor
        )}
      >
        {/* Badge */}
        <div className="absolute top-6 left-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-xs">
            <Camera className="w-3.5 h-3.5" />
            <span>스드메 AI</span>
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* English name */}
          <p className="text-slate-700/60 text-sm font-medium mb-1">
            {themeNameEn}
          </p>
          
          {/* Korean name */}
          <h3 className="text-slate-900 text-2xl font-bold mb-3">
            {themeName}
          </h3>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-900/10 text-slate-700 text-xs">
              {imageCount}장의 화보
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/10 text-slate-700 text-xs">
              AI 촬영
            </span>
          </div>

          {/* Tagline */}
          {uiConfig?.tagline && (
            <p className="mt-4 text-slate-600 text-sm">
              곧 이 컨셉의 아름다운 화보가 완성됩니다...
            </p>
          )}
        </div>

        {/* Decorative gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
          }}
        />
      </div>
    </div>
  );
}
