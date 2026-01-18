'use client';

import { memo, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GuidelineCardProps {
  title?: string;
  defaultExpanded?: boolean;
  goodExamples?: string[];
  badExamples?: string[];
  className?: string;
}

const DEFAULT_GOOD_EXAMPLES = [
  '정면 얼굴이 잘 보이는 사진',
  '자연스러운 표정의 사진',
  '다양한 각도의 사진',
  '밝고 선명한 사진',
];

const DEFAULT_BAD_EXAMPLES = [
  '얼굴이 가려진 사진',
  '흐린 사진이나 저화질 사진',
  '과도한 필터가 적용된 사진',
  '선글라스나 마스크를 착용한 사진',
];

export const GuidelineCard = memo(function GuidelineCard({
  title = '사진 가이드',
  defaultExpanded = true,
  goodExamples = DEFAULT_GOOD_EXAMPLES,
  badExamples = DEFAULT_BAD_EXAMPLES,
  className,
}: GuidelineCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-700 bg-slate-800 overflow-hidden',
        className
      )}
    >
      {/* 헤더 */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? '접기' : '펼치기'}
      >
        <span className="text-sm font-medium text-slate-200">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* 컨텐츠 */}
      {isExpanded && (
        <div
          data-testid="guideline-content"
          className="px-4 pb-4 grid grid-cols-2 gap-4"
        >
          {/* 좋은 예시 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-4 h-4" />
              <span className="text-xs font-medium">좋은 사진</span>
            </div>
            <ul className="space-y-1.5">
              {goodExamples.map((example, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check
                    className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0 mt-0.5"
                    data-testid="good-icon"
                  />
                  <span className="text-xs text-slate-300">{example}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 나쁜 예시 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-red-400">
              <X className="w-4 h-4" />
              <span className="text-xs font-medium">피해야 할 사진</span>
            </div>
            <ul className="space-y-1.5">
              {badExamples.map((example, index) => (
                <li key={index} className="flex items-start gap-2">
                  <X
                    className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0 mt-0.5"
                    data-testid="bad-icon"
                  />
                  <span className="text-xs text-slate-300">{example}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
});
