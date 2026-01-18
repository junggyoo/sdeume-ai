'use client';

import { memo, useCallback } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Upload from 'lucide-react/dist/esm/icons/upload';
import { cn } from '@/lib/utils';
import type { QueuedFile } from '../types';
import { getPhotoStatus, getStatusColor, getStatusIcon, type PhotoStatus } from '../lib/photo-status';

export interface PhotoCardProps {
  item: QueuedFile;
  onRemove: (id: string) => void;
}

const StatusIcon = memo(function StatusIcon({
  status,
  className,
}: {
  status: PhotoStatus;
  className?: string;
}) {
  const iconName = getStatusIcon(status);
  const iconProps = {
    className: cn('w-4 h-4', className),
    'data-testid': `status-icon-${iconName}`,
  };

  switch (iconName) {
    case 'CheckCircle':
      return <CheckCircle {...iconProps} />;
    case 'AlertCircle':
      return <AlertCircle {...iconProps} />;
    case 'XCircle':
      return <XCircle {...iconProps} />;
    case 'Loader2':
      return <Loader2 {...iconProps} className={cn(iconProps.className, 'animate-spin')} />;
    case 'Upload':
      return <Upload {...iconProps} />;
    case 'Clock':
    default:
      return <Clock {...iconProps} />;
  }
});

const borderColorMap: Record<string, string> = {
  emerald: 'border-emerald-400',
  amber: 'border-amber-400',
  red: 'border-red-400',
  slate: 'border-slate-600',
  violet: 'border-violet-400',
};

const textColorMap: Record<string, string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  slate: 'text-slate-400',
  violet: 'text-violet-400',
};

const bgColorMap: Record<string, string> = {
  emerald: 'bg-emerald-400/10',
  amber: 'bg-amber-400/10',
  red: 'bg-red-400/10',
  slate: 'bg-slate-700/50',
  violet: 'bg-violet-400/10',
};

export const PhotoCard = memo(function PhotoCard({ item, onRemove }: PhotoCardProps) {
  const { status, message } = getPhotoStatus(item);
  const color = getStatusColor(status);

  const handleRemove = useCallback(() => {
    onRemove(item.id);
  }, [item.id, onRemove]);

  const isInvalid = status === 'invalid';
  const isProcessing = status === 'analyzing' || status === 'uploading' || status === 'pending';

  return (
    <div
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200',
        'bg-slate-800 animate-in fade-in slide-in-from-bottom-2',
        borderColorMap[color]
      )}
    >
      {/* 이미지 */}
      {item.previewUrl && (
        <img
          src={item.previewUrl}
          alt="업로드된 사진"
          className={cn(
            'w-full h-full object-cover',
            isInvalid && 'grayscale opacity-50'
          )}
        />
      )}

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={handleRemove}
        className={cn(
          'absolute top-1 right-1 p-1 rounded-full',
          'bg-black/60 hover:bg-black/80 transition-colors',
          'text-white/80 hover:text-white'
        )}
        aria-label="삭제"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* 상태 배지 */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 px-2 py-1.5',
          'flex items-center gap-1.5',
          bgColorMap[color],
          'backdrop-blur-sm'
        )}
      >
        <StatusIcon status={status} className={textColorMap[color]} />
        <span className={cn('text-xs font-medium truncate', textColorMap[color])}>
          {message}
        </span>
      </div>

      {/* 처리 중 오버레이 */}
      {isProcessing && (
        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
});
