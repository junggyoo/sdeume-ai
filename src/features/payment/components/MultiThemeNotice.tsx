'use client';

import { Info } from 'lucide-react';

interface MultiThemeNoticeProps {
  themeCount: number;
}

export function MultiThemeNotice({ themeCount }: MultiThemeNoticeProps) {
  const additionalThemes = themeCount - 1;

  return (
    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
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
