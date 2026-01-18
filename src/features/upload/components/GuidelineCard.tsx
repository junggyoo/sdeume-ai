'use client';

import { memo } from 'react';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import { cn } from '@/lib/utils';

export interface GuidelineCardProps {
  className?: string;
}

const GOOD_EXAMPLES = [
  '정면을 바라본 사진',
  '밝고 선명한 사진',
  '얼굴이 잘 보이는 사진',
];

const BAD_EXAMPLES = [
  '선글라스나 마스크 착용',
  '심하게 흐릿하거나 어두운 사진',
  '얼굴이 가려진 사진',
];

export const GuidelineCard = memo(function GuidelineCard({
  className,
}: GuidelineCardProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-3', className)}>
      {/* 좋은 사진 */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-emerald-400">
            이런 사진이 좋아요
          </span>
        </div>
        <ul className="space-y-2">
          {GOOD_EXAMPLES.map((example, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-slate-500">👤</span>
              {example}
            </li>
          ))}
        </ul>
      </div>

      {/* 피해야 할 사진 */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-3 h-3 text-red-400" />
          </div>
          <span className="text-sm font-medium text-red-400">
            이런 사진은 피해주세요
          </span>
        </div>
        <ul className="space-y-2">
          {BAD_EXAMPLES.map((example, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
              <X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />
              {example}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
