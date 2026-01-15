'use client';

import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RerollButtonProps {
  remainingCount?: number;
  disabled?: boolean;
  className?: string;
}

export function RerollButton({
  remainingCount = 1,
  disabled = false,
  className,
}: RerollButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      alert('준비 중입니다');
    }
  };

  return (
    <button
      data-testid="reroll-button"
      aria-label="사진 다시 찍기"
      aria-disabled={disabled}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 px-6 py-4 rounded-card',
        'bg-surface border border-gray-200',
        'transition-all duration-200',
        'hover:border-accent-rose/50 hover:shadow-sm',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-rose focus-visible:ring-offset-2',
        className
      )}
      onClick={handleClick}
    >
      {/* 아이콘 */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-rose/10">
        <RefreshCw className="w-5 h-5 text-accent-rose" />
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col items-start">
        <span className="font-sans text-sm font-medium text-primary-desktop">
          아쉬운 사진 다시 찍기
        </span>
        {/* 배지 */}
        <span
          data-testid="reroll-badge"
          className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-rose/10 text-accent-rose"
        >
          {remainingCount}회 무료
        </span>
      </div>
    </button>
  );
}
