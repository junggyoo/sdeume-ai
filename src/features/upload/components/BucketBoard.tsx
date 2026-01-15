'use client';

import { cn } from '@/lib/utils';
import type { BucketSummary } from '../types';
import { BUCKET_TARGETS, MIN_IMAGES_TO_PROCEED } from '../types';
import { Check, AlertCircle } from 'lucide-react';

interface BucketBoardProps {
  summary: BucketSummary;
  className?: string;
}

export function BucketBoard({ summary, className }: BucketBoardProps) {
  const bucketAStatus = getBucketStatus(summary.bucketA, BUCKET_TARGETS.A);
  const bucketBStatus = getBucketStatus(summary.bucketB, BUCKET_TARGETS.B);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            업로드 진행률
          </span>
          <span className="text-sm text-gray-500">
            {summary.total} / {MIN_IMAGES_TO_PROCEED}장
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              summary.total >= MIN_IMAGES_TO_PROCEED
                ? 'bg-accent-teal'
                : 'bg-accent-rose'
            )}
            style={{
              width: `${Math.min((summary.total / MIN_IMAGES_TO_PROCEED) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Bucket Summary */}
      <div className="grid grid-cols-3 gap-3">
        <BucketCard
          label={`${BUCKET_TARGETS.A.label} (A)`}
          count={summary.bucketA}
          target={BUCKET_TARGETS.A}
          status={bucketAStatus}
          colorClass="text-accent-teal"
        />
        <BucketCard
          label={`${BUCKET_TARGETS.B.label} (B)`}
          count={summary.bucketB}
          target={BUCKET_TARGETS.B}
          status={bucketBStatus}
          colorClass="text-accent-rose"
        />
        <BucketCard
          label={`${BUCKET_TARGETS.C.label} (C)`}
          count={summary.bucketC}
          target={BUCKET_TARGETS.C}
          status="neutral"
          colorClass="text-gray-500"
        />
      </div>
    </div>
  );
}

type BucketStatus = 'complete' | 'insufficient' | 'neutral';

function getBucketStatus(
  count: number,
  target: { min: number; max: number }
): BucketStatus {
  if (count >= target.min) return 'complete';
  if (count > 0) return 'insufficient';
  return 'neutral';
}

interface BucketCardProps {
  label: string;
  count: number;
  target: { min: number; max: number; label: string };
  status: BucketStatus;
  colorClass: string;
}

function BucketCard({
  label,
  count,
  target,
  status,
  colorClass,
}: BucketCardProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border text-center',
        status === 'complete' && 'border-accent-teal bg-accent-teal/5',
        status === 'insufficient' && 'border-amber-400 bg-amber-50',
        status === 'neutral' && 'border-gray-200 bg-gray-50'
      )}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className={cn('text-2xl font-bold', colorClass)}>{count}</span>
        {status === 'complete' && (
          <Check className="w-4 h-4 text-accent-teal" />
        )}
        {status === 'insufficient' && (
          <AlertCircle className="w-4 h-4 text-amber-500" />
        )}
      </div>
      <span className="text-xs text-gray-600">{label}</span>
      {target.min > 0 && (
        <div className="text-xs text-gray-400 mt-1">
          목표: {target.min}~{target.max === Infinity ? '+' : target.max}장
        </div>
      )}
    </div>
  );
}
