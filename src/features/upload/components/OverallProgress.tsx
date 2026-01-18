import { memo } from 'react';
import User from 'lucide-react/dist/esm/icons/user';
import { cn } from '@/lib/utils';
import { MIN_PHOTOS_PER_ROLE, RECOMMENDED_PHOTOS_PER_ROLE } from '../types';

export interface OverallProgressProps {
  groomCount: number;
  brideCount: number;
  minPerRole?: number;
  recommendedPerRole?: number;
  className?: string;
}

export const OverallProgress = memo(function OverallProgress({
  groomCount,
  brideCount,
  minPerRole = MIN_PHOTOS_PER_ROLE,
  recommendedPerRole = RECOMMENDED_PHOTOS_PER_ROLE,
  className,
}: OverallProgressProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-700 bg-slate-800 p-4',
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-200">사진 업로드 현황</h3>
          <p className="text-xs text-slate-500">
            각각 최소 {minPerRole}장, 권장 {recommendedPerRole}장
          </p>
        </div>
      </div>

      {/* 신부/신랑 카운트 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-base">👰</span>
            <span className="text-sm text-slate-300">신부</span>
          </div>
          <span className="text-sm font-semibold text-slate-100">{brideCount}장</span>
        </div>

        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-base">🤵</span>
            <span className="text-sm text-slate-300">신랑</span>
          </div>
          <span className="text-sm font-semibold text-slate-100">{groomCount}장</span>
        </div>
      </div>
    </div>
  );
});
