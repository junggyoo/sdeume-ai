'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Sparkles, Users } from 'lucide-react';
import {
  MIN_PHOTOS_PER_ROLE,
  MIN_TOTAL_PHOTOS,
  RECOMMENDED_PHOTOS_PER_ROLE,
} from '../types';

// Re-export for convenience
export { MIN_PHOTOS_PER_ROLE, MIN_TOTAL_PHOTOS, RECOMMENDED_PHOTOS_PER_ROLE };

interface GapFillingPromptProps {
  totalCount: number;
  groomCount: number;
  brideCount: number;
  needsMoreFrontal: boolean;
  needsMoreSide: boolean;
  gapFillingMessage: string | null;
  className?: string;
}

export function GapFillingPrompt({
  totalCount,
  groomCount,
  brideCount,
  needsMoreFrontal,
  needsMoreSide,
  gapFillingMessage,
  className,
}: GapFillingPromptProps) {
  // Nothing to show
  if (totalCount === 0) {
    return null;
  }

  // Check role requirements
  const groomNeedsMore = groomCount < MIN_PHOTOS_PER_ROLE;
  const brideNeedsMore = brideCount < MIN_PHOTOS_PER_ROLE;
  const needsMoreTotal = totalCount < MIN_TOTAL_PHOTOS;

  // Check if reached recommended level
  const groomRecommended = groomCount >= RECOMMENDED_PHOTOS_PER_ROLE;
  const brideRecommended = brideCount >= RECOMMENDED_PHOTOS_PER_ROLE;

  // Both roles need more photos
  if (groomNeedsMore || brideNeedsMore) {
    const messages: string[] = [];
    if (groomNeedsMore) {
      messages.push(`신랑 ${MIN_PHOTOS_PER_ROLE - groomCount}장`);
    }
    if (brideNeedsMore) {
      messages.push(`신부 ${MIN_PHOTOS_PER_ROLE - brideCount}장`);
    }

    return (
      <div
        className={cn(
          'p-4 rounded-xl bg-rose-50 border border-rose-200',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="font-medium text-rose-700">
              {messages.join(', ')} 더 필요해요
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              신랑, 신부 각각 최소 {MIN_PHOTOS_PER_ROLE}장씩 필요합니다 (
              {RECOMMENDED_PHOTOS_PER_ROLE}장 권장)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Roles are satisfied but total is not enough
  if (needsMoreTotal) {
    return (
      <div
        className={cn(
          'p-4 rounded-xl bg-gray-50 border border-gray-200',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-700">
              {MIN_TOTAL_PHOTOS - totalCount}장 더 필요해요
            </p>
            {gapFillingMessage && (
              <p className="text-sm text-gray-600 mt-0.5">
                특히 {gapFillingMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Both roles reached recommended level - perfect!
  if (groomRecommended && brideRecommended && !needsMoreFrontal && !needsMoreSide) {
    return (
      <div
        className={cn(
          'p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/30',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-teal" />
          </div>
          <div>
            <p className="font-medium text-accent-teal">
              완벽해요! 최고 퀄리티로 진행할 수 있어요
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              권장 수량을 모두 충족했습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Minimum met - can proceed
  if (!needsMoreFrontal && !needsMoreSide) {
    return (
      <div
        className={cn(
          'p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/30',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-teal" />
          </div>
          <div>
            <p className="font-medium text-accent-teal">
              좋아요! 다음 단계로 넘어갈 수 있어요
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              {RECOMMENDED_PHOTOS_PER_ROLE}장씩 업로드하면 더 좋은 결과를 얻을 수
              있어요
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Soft pass - can proceed but could be better
  return (
    <div
      className={cn(
        'p-4 rounded-xl bg-amber-50 border border-amber-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-medium text-amber-700">지금도 진행 가능해요!</p>
          <p className="text-sm text-gray-600 mt-0.5">
            {gapFillingMessage} 추가하면 퀄리티가 더 좋아져요
          </p>
        </div>
      </div>
    </div>
  );
}
