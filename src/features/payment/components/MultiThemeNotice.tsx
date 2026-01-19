'use client';

import { cn } from '@/lib/utils';

interface MultiThemeNoticeProps {
  themeCount: number;
  isSelected?: boolean;
}

export function MultiThemeNotice({ themeCount, isSelected }: MultiThemeNoticeProps) {
  const additionalThemes = themeCount - 1;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        isSelected
          ? 'bg-amber-500/20 border-amber-500/30'
          : 'bg-amber-500/10 border-amber-500/20'
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-base flex-shrink-0">💡</span>
        <div className="text-sm">
          <p className="font-medium text-amber-400">
            지금 1개 선택, 나머지는 언제든!
          </p>
          <p className="text-amber-400/70 mt-0.5">
            촬영 완료 후 {additionalThemes}개 테마 추가 선택 가능
          </p>
        </div>
      </div>
    </div>
  );
}
