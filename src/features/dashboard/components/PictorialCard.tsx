import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Pictorial } from '../types';
import { DASHBOARD_COPY } from '../constants';

export interface PictorialCardProps {
  pictorial: Pictorial;
  className?: string;
}

export function PictorialCard({ pictorial, className }: PictorialCardProps) {
  const { id, projectName, themeDisplayNameKo, images } = pictorial;

  const displayName = projectName ?? themeDisplayNameKo ?? '화보';
  const photoCount = images.length;
  const thumbnailUrl = images[0]?.thumbnail_url ?? images[0]?.url ?? '';
  const altText = `${displayName} 화보 썸네일`;

  return (
    <Link
      href={`/gallery/${id}`}
      data-testid="pictorial-card"
      className={cn(
        'group block rounded-lg overflow-hidden bg-card border shadow-sm',
        'hover:shadow-md hover:border-primary-desktop/30 transition-all',
        className
      )}
      aria-label={`${displayName} 화보 보기`}
    >
      {/* Thumbnail Container */}
      <div
        data-testid="image-container"
        className="relative aspect-[3/4] overflow-hidden bg-muted"
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={altText}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span>No Image</span>
          </div>
        )}

        {/* Photo Count Badge */}
        <div
          data-testid="photo-count-badge"
          className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium"
        >
          {DASHBOARD_COPY.gallery.photoCount(photoCount)}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3">
        <p className="text-sm font-medium text-primary-desktop truncate">
          {displayName}
        </p>
      </div>
    </Link>
  );
}
