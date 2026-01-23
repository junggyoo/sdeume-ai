'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import X from 'lucide-react/dist/esm/icons/x';
import RotateCw from 'lucide-react/dist/esm/icons/rotate-cw';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { cn } from '@/lib/utils';
import type { QueuedFile, BucketType } from '@/features/upload/types';

interface AtelierPhotoCardProps {
  item: QueuedFile;
  onRemove: (id: string) => void;
  onRotate?: (id: string, degrees: 90 | -90) => void;
  index?: number;
}

function getStatusBadge(
  status: QueuedFile['status'],
  bucket?: BucketType
): { label: string; variant: 'good' | 'warning' | 'processing' } | null {
  if (status === 'analyzing') {
    return { label: '분석 중', variant: 'processing' };
  }

  if (
    status === 'completed' ||
    status === 'synced' ||
    status === 'uploading'
  ) {
    if (bucket === 'D') {
      return { label: '제외됨', variant: 'warning' };
    }
    // Quality issues from analysis
    if (bucket === 'C') {
      return { label: '양호', variant: 'good' };
    }
    if (bucket === 'A' || bucket === 'B') {
      return { label: '양호', variant: 'good' };
    }
    return { label: '양호', variant: 'good' };
  }

  return null;
}

export function AtelierPhotoCard({
  item,
  onRemove,
  onRotate,
  index = 0,
}: AtelierPhotoCardProps) {
  const statusBadge = getStatusBadge(item.status, item.analysis?.bucket);
  const hasQualityIssue =
    item.analysis?.qualityIssues && item.analysis.qualityIssues.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: index * 0.05,
      }}
      className="relative aspect-square rounded-2xl overflow-hidden group bg-white shadow-sm border border-gray-100"
    >
      {/* Image */}
      {item.previewUrl && (
        <Image
          src={item.previewUrl}
          alt="Uploaded photo"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      )}

      {/* Processing overlay */}
      {item.status === 'analyzing' && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="text-white animate-spin" size={32} />
        </div>
      )}

      {/* Error overlay */}
      {item.status === 'error' && (
        <div className="absolute inset-0 bg-red-500/40 backdrop-blur-sm flex items-center justify-center">
          <AlertTriangle className="text-white" size={32} />
        </div>
      )}

      {/* Action buttons (visible on hover) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Rotate button */}
        {onRotate && item.status === 'completed' && (
          <button
            onClick={() => onRotate(item.id, 90)}
            className={cn(
              'w-7 h-7 rounded-full',
              'bg-black/60 hover:bg-black/80',
              'flex items-center justify-center',
              'text-white'
            )}
            title="90도 회전"
          >
            <RotateCw size={14} />
          </button>
        )}
        {/* Remove button */}
        <button
          onClick={() => onRemove(item.id)}
          className={cn(
            'w-7 h-7 rounded-full',
            'bg-black/60 hover:bg-black/80',
            'flex items-center justify-center',
            'text-white'
          )}
        >
          <X size={14} />
        </button>
      </div>

      {/* Status badge */}
      {statusBadge && (
        <div
          className={cn(
            'absolute bottom-2 left-2 px-2 py-1 backdrop-blur-md rounded-lg',
            'text-[10px] font-bold uppercase flex items-center gap-1',
            statusBadge.variant === 'good' &&
              'bg-white/90 text-green-600',
            statusBadge.variant === 'warning' &&
              'bg-red-500/90 text-white',
            statusBadge.variant === 'processing' &&
              'bg-white/90 text-gray-500'
          )}
        >
          {statusBadge.variant === 'good' && <CheckCircle2 size={10} />}
          {statusBadge.variant === 'warning' && <AlertTriangle size={10} />}
          {statusBadge.variant === 'processing' && (
            <Loader2 size={10} className="animate-spin" />
          )}
          {statusBadge.label}
        </div>
      )}

      {/* Quality warning badge */}
      {hasQualityIssue && !statusBadge && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-amber-500/90 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase flex items-center gap-1">
          <AlertTriangle size={10} />
          조명 부족
        </div>
      )}
    </motion.div>
  );
}
