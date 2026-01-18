import { memo } from 'react';
import { cn } from '@/lib/utils';
import { MIN_PHOTOS_PER_ROLE, RECOMMENDED_PHOTOS_PER_ROLE } from '../types';

export interface ProgressIndicatorProps {
  current: number;
  min?: number;
  recommended?: number;
  label?: string;
  className?: string;
}

function getProgressColor(current: number, min: number, recommended: number): string {
  if (current >= recommended) return 'bg-emerald-500';
  if (current >= min) return 'bg-amber-500';
  return 'bg-violet-500';
}

export const ProgressIndicator = memo(function ProgressIndicator({
  current,
  min = MIN_PHOTOS_PER_ROLE,
  recommended = RECOMMENDED_PHOTOS_PER_ROLE,
  label,
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.min((current / recommended) * 100, 100);
  const minPercentage = (min / recommended) * 100;
  const progressColor = getProgressColor(current, min, recommended);

  return (
    <div className={cn('rounded-xl border border-slate-700 bg-slate-800 p-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">
          {label || '업로드 진행'}
        </span>
        <span className="text-sm font-semibold text-slate-100">
          <span data-testid="current-count">{current}</span>장
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div
        className="relative mb-2"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={recommended}
        aria-label={label ? `${label} 진행률` : '업로드 진행률'}
      >
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            data-testid="progress-fill"
            className={cn('h-full transition-all duration-300 rounded-full', progressColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 최소값 마커 */}
        <div
          data-testid="min-marker"
          className="absolute top-0 h-2 border-r border-slate-500"
          style={{ left: `${minPercentage}%` }}
        />
        {/* 권장값 마커 (끝) */}
        <div
          data-testid="recommended-marker"
          className="absolute top-0 h-2 border-r-2 border-slate-400"
          style={{ left: '100%', transform: 'translateX(-2px)' }}
        />
      </div>

      {/* 마커 레이블 */}
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span>{recommended}</span>
      </div>
    </div>
  );
});
