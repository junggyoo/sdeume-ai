'use client';

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, Loader2, X, Check, AlertCircle } from 'lucide-react';
import type { QueuedFile, BucketType } from '../types';
import { getBucketLabel, getBucketColor } from '../lib/bucket-classifier';

interface BulkUploaderProps {
  onFilesSelect: (files: FileList) => void;
  queue: QueuedFile[];
  onRemove: (id: string) => void;
  isProcessing: boolean;
  processingCount: number;
  disabled?: boolean;
  className?: string;
}

export function BulkUploader({
  onFilesSelect,
  queue,
  onRemove,
  isProcessing,
  processingCount,
  disabled,
  className,
}: BulkUploaderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelect(e.target.files);
        // Reset input to allow selecting the same files again
        e.target.value = '';
      }
    },
    [onFilesSelect]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Zone */}
      <label
        className={cn(
          'flex flex-col items-center justify-center',
          'p-8 border-2 border-dashed rounded-xl',
          'transition-colors cursor-pointer',
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-desktop hover:bg-gray-50'
        )}
      >
        <div className="w-12 h-12 rounded-full bg-primary-desktop/10 flex items-center justify-center mb-3">
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-primary-desktop animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-primary-desktop" />
          )}
        </div>

        {isProcessing ? (
          <span className="text-sm text-gray-600">
            {processingCount}장 분석 중...
          </span>
        ) : (
          <>
            <span className="font-medium text-primary-desktop">
              사진 선택하기
            </span>
            <span className="text-sm text-gray-500 mt-1">
              20~30장을 한 번에 선택해주세요
            </span>
          </>
        )}

        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
          onChange={handleChange}
          disabled={disabled || isProcessing}
          className="hidden"
        />
      </label>

      {/* Queue Grid */}
      {queue.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {queue.map((item) => (
            <QueueItem key={item.id} item={item} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}

interface QueueItemProps {
  item: QueuedFile;
  onRemove: (id: string) => void;
}

const QueueItem = memo(function QueueItem({ item, onRemove }: QueueItemProps) {
  const isExcluded = item.analysis?.bucket === 'D';

  const handleRemove = useCallback(() => {
    onRemove(item.id);
  }, [item.id, onRemove]);

  return (
    <div className={cn('relative group aspect-square', isExcluded && 'opacity-50')}>
      {/* Image */}
      {item.previewUrl && (
        <img
          src={item.previewUrl}
          alt=""
          decoding="async"
          loading="lazy"
          className={cn(
            'w-full h-full object-cover rounded-lg',
            isExcluded && 'grayscale'
          )}
        />
      )}

      {/* Status Overlay */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg flex items-center justify-center',
          item.status === 'pending' && 'bg-black/30',
          item.status === 'analyzing' && 'bg-black/30',
          item.status === 'error' && 'bg-red-500/30'
        )}
      >
        {item.status === 'analyzing' && (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        )}
        {item.status === 'error' && (
          <AlertCircle className="w-6 h-6 text-white" />
        )}
      </div>

      {/* Excluded Overlay */}
      {isExcluded && (
        <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
            제외됨
          </span>
        </div>
      )}

      {/* Bucket Badge */}
      {item.status === 'completed' && item.analysis && (
        <BucketBadge bucket={item.analysis.bucket} />
      )}

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className={cn(
          'absolute top-1 right-1 w-6 h-6 rounded-full',
          'bg-black/50 text-white',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'flex items-center justify-center'
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

interface BucketBadgeProps {
  bucket: BucketType;
}

function BucketBadge({ bucket }: BucketBadgeProps) {
  const colorClasses: Record<BucketType, string> = {
    A: 'bg-accent-teal text-white',
    B: 'bg-accent-rose text-white',
    C: 'bg-amber-500 text-white',
    D: 'bg-gray-400 text-white',
  };

  return (
    <div
      className={cn(
        'absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium',
        colorClasses[bucket]
      )}
    >
      {bucket}
    </div>
  );
}
