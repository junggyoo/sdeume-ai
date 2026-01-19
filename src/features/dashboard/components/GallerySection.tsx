import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_COPY, GRID_CONFIG } from '../constants';
import type { Pictorial } from '../types';
import { PictorialCard } from './PictorialCard';
import { EmptyGalleryState } from './EmptyGalleryState';

export interface GallerySectionProps {
  pictorials: Pictorial[];
  isLoading: boolean;
  className?: string;
}

const SKELETON_COUNT = 8;

export function GallerySection({
  pictorials,
  isLoading,
  className,
}: GallerySectionProps) {
  const headingId = 'gallery-section-heading';

  return (
    <section
      data-testid="gallery-section"
      role="region"
      aria-labelledby={headingId}
      className={cn('space-y-4', className)}
    >
      <h2 id={headingId} className="text-lg font-semibold text-white">
        {DASHBOARD_COPY.gallery.title}
      </h2>

      {isLoading ? (
        <GallerySkeleton />
      ) : pictorials.length === 0 ? (
        <EmptyGalleryState />
      ) : (
        <div
          data-testid="gallery-grid"
          className={GRID_CONFIG.gallery}
        >
          {pictorials.map((pictorial) => (
            <PictorialCard key={pictorial.id} pictorial={pictorial} />
          ))}
        </div>
      )}
    </section>
  );
}

function GallerySkeleton() {
  return (
    <div className={GRID_CONFIG.gallery}>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <div
          key={index}
          data-testid="gallery-skeleton"
          className="space-y-2"
        >
          <Skeleton
            data-testid="skeleton-image"
            className="aspect-[3/4] rounded-lg bg-slate-700"
          />
          <Skeleton
            data-testid="skeleton-text"
            variant="text"
            className="w-3/4"
          />
        </div>
      ))}
    </div>
  );
}
