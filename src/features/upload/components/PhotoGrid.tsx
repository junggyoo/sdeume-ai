'use client';

import { memo, useCallback, useRef } from 'react';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { cn } from '@/lib/utils';
import type { QueuedFile, UploadRole } from '../types';
import { PhotoCard } from './PhotoCard';

export interface PhotoGridProps {
  items: QueuedFile[];
  onRemove: (id: string) => void;
  onAddMore?: (files: FileList) => void;
  role: UploadRole;
  maxPhotos?: number;
  columns?: 3 | 4 | 5;
  showTitle?: boolean;
  className?: string;
}

const columnClasses: Record<number, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

const ROLE_EMOJI: Record<UploadRole, string> = {
  bride: '👰',
  groom: '🤵',
};

const ROLE_LABELS: Record<UploadRole, string> = {
  bride: '신부',
  groom: '신랑',
};

export const PhotoGrid = memo(function PhotoGrid({
  items,
  onRemove,
  onAddMore,
  role,
  maxPhotos = 20,
  columns = 4,
  showTitle = true,
  className,
}: PhotoGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && onAddMore) {
        onAddMore(files);
      }
      e.target.value = '';
    },
    [onAddMore]
  );

  const photoCount = items.length;

  return (
    <div className={className}>
      {/* 히든 인풋 */}
      {onAddMore && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          className="hidden"
        />
      )}

      {/* 제목 */}
      {showTitle && (
        <h3 className="text-sm font-medium text-slate-300 mb-3">
          {ROLE_EMOJI[role]} {ROLE_LABELS[role]} 업로드된 사진 ({photoCount}/{maxPhotos})
        </h3>
      )}

      {/* 그리드 */}
      <ul
        role="list"
        data-testid="photo-grid"
        className={cn('grid gap-2', columnClasses[columns])}
      >
        {/* 사진 카드들 */}
        {items.map((item) => (
          <li key={item.id}>
            <PhotoCard item={item} onRemove={onRemove} />
          </li>
        ))}

        {/* 빈 슬롯 (추가 버튼) */}
        {onAddMore && photoCount < maxPhotos && (
          <li>
            <button
              type="button"
              onClick={handleAddClick}
              className={cn(
                'w-full aspect-square rounded-lg',
                'border-2 border-dashed border-slate-600',
                'bg-slate-800/50 hover:bg-slate-700/50',
                'flex items-center justify-center',
                'transition-colors'
              )}
              aria-label="사진 추가"
            >
              <Plus className="w-6 h-6 text-slate-500" />
            </button>
          </li>
        )}
      </ul>
    </div>
  );
});
