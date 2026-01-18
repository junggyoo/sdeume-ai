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
    <div className={cn('space-y-2', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-sm font-medium text-slate-300">{label}</span>
        )}
        <span className="text-lg font-bold text-slate-100">{current}</span>
      </div>

      {/* 프로그레스 바 */}
      <div className="relative">
        <div
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={recommended}
          aria-label={label ? `${label} 진행률` : '진행률'}
          className="h-2 bg-slate-700 rounded-full overflow-hidden"
        >
          <div
            data-testid="progress-fill"
            className={cn(
              'h-full transition-all duration-300 ease-out rounded-full',
              progressColor
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 마커들 */}
        <div className="relative h-4 mt-1">
          {/* 최소값 마커 (점선) */}
          <div
            data-testid="min-marker"
            className="absolute flex flex-col items-center"
            style={{ left: `${minPercentage}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-px h-2 border-l border-dashed border-slate-500" />
            <span className="text-xs text-slate-500">{min}</span>
          </div>

          {/* 권장값 마커 (실선) */}
          <div
            data-testid="recommended-marker"
            className="absolute flex flex-col items-center"
            style={{ left: '100%', transform: 'translateX(-50%)' }}
          >
            <div className="w-px h-2 border-l border-solid border-slate-400" />
            <span className="text-xs text-slate-400">{recommended}</span>
          </div>
        </div>
      </div>

      {/* 상태 텍스트 */}
      <p className="text-xs text-slate-400">
        {current < min && `${min - current}장 더 필요해요`}
        {current >= min && current < recommended && `${recommended - current}장 더 추가하면 완벽!`}
        {current >= recommended && '충분해요!'}
      </p>
    </div>
  );
});
