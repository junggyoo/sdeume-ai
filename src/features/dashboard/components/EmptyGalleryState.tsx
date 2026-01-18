import * as React from 'react';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import { cn } from '@/lib/utils';
import { DASHBOARD_COPY } from '../constants';

export interface EmptyGalleryStateProps {
  message?: string;
  className?: string;
}

export function EmptyGalleryState({ message, className }: EmptyGalleryStateProps) {
  const displayMessage = message ?? DASHBOARD_COPY.gallery.emptyState;

  return (
    <div
      data-testid="empty-gallery-state"
      role="status"
      aria-label="갤러리 비어있음"
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-12 text-center',
        className
      )}
    >
      <div
        data-testid="empty-illustration"
        className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"
      >
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="text-gray-900 font-medium">{displayMessage}</p>
        <p className="text-sm text-muted-foreground">
          {DASHBOARD_COPY.gallery.emptyStateSubtitle}
        </p>
      </div>
    </div>
  );
}
