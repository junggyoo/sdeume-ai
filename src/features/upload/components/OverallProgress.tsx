import { memo } from 'react';
import { cn } from '@/lib/utils';
import { MIN_PHOTOS_PER_ROLE, RECOMMENDED_PHOTOS_PER_ROLE } from '../types';

export interface OverallProgressProps {
  groomCount: number;
  brideCount: number;
  minPerRole?: number;
  recommendedPerRole?: number;
  className?: string;
}

interface RoleProgressProps {
  emoji: string;
  label: string;
  count: number;
  min: number;
  recommended: number;
}

function getProgressColor(count: number, min: number, recommended: number): string {
  if (count >= recommended) return 'bg-emerald-500';
  if (count >= min) return 'bg-amber-500';
  return 'bg-violet-500';
}

function getStatusMessage(count: number, min: number, recommended: number): string {
  if (count >= recommended) return '충분해요!';
  if (count >= min) return `${recommended - count}장 더 추가하면 완벽!`;
  return `${min - count}장 더 필요해요`;
}

const RoleProgress = memo(function RoleProgress({
  emoji,
  label,
  count,
  min,
  recommended,
}: RoleProgressProps) {
  const percentage = Math.min((count / recommended) * 100, 100);
  const color = getProgressColor(count, min, recommended);
  const message = getStatusMessage(count, min, recommended);
  const isComplete = count >= recommended;

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <span
          className={cn(
            'text-lg font-bold',
            isComplete ? 'text-emerald-400' : 'text-slate-100'
          )}
        >
          {count}
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={recommended}
        aria-label={`${label} 진행률`}
        className="h-1.5 bg-slate-700 rounded-full overflow-hidden"
      >
        <div
          className={cn('h-full transition-all duration-300 rounded-full', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 상태 메시지 */}
      <p
        className={cn(
          'text-xs',
          isComplete ? 'text-emerald-400' : 'text-slate-400'
        )}
      >
        {message}
      </p>
    </div>
  );
});

export const OverallProgress = memo(function OverallProgress({
  groomCount,
  brideCount,
  minPerRole = MIN_PHOTOS_PER_ROLE,
  recommendedPerRole = RECOMMENDED_PHOTOS_PER_ROLE,
  className,
}: OverallProgressProps) {
  const isBothComplete =
    brideCount >= recommendedPerRole && groomCount >= recommendedPerRole;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border bg-slate-800 transition-colors',
        isBothComplete
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-slate-700',
        className
      )}
    >
      <div data-testid="progress-grid" className="grid grid-cols-2 gap-6">
        <RoleProgress
          emoji="👰"
          label="신부"
          count={brideCount}
          min={minPerRole}
          recommended={recommendedPerRole}
        />
        <RoleProgress
          emoji="🤵"
          label="신랑"
          count={groomCount}
          min={minPerRole}
          recommended={recommendedPerRole}
        />
      </div>
    </div>
  );
});
