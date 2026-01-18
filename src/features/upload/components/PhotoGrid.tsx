'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { QueuedFile } from '../types';
import { PhotoCard } from './PhotoCard';

export interface PhotoGridProps {
  items: QueuedFile[];
  onRemove: (id: string) => void;
  columns?: 3 | 4 | 5;
  emptyMessage?: string;
  className?: string;
}

const columnClasses: Record<number, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

export const PhotoGrid = memo(function PhotoGrid({
  items,
  onRemove,
  columns = 4,
  emptyMessage = '사진이 없습니다',
  className,
}: PhotoGridProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-8 text-slate-500 text-sm',
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul
      role="list"
      data-testid="photo-grid"
      className={cn('grid gap-2', columnClasses[columns], className)}
    >
      {items.map((item) => (
        <li key={item.id}>
          <PhotoCard item={item} onRemove={onRemove} />
        </li>
      ))}
    </ul>
  );
});
