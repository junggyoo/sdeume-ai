'use client';

import { cn } from '@/lib/utils';

interface RefundGuaranteeProps {
  variant?: 'light' | 'dark';
}

export function RefundGuarantee({ variant = 'light' }: RefundGuaranteeProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl',
        isDark
          ? 'bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-700/30'
          : 'bg-violet-50 border border-violet-200'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isDark ? 'bg-violet-800/50' : 'bg-violet-100'
        )}
      >
        <span className="text-lg">🛡️</span>
      </div>
      <div>
        <p
          className={cn(
            'font-bold text-sm',
            isDark ? 'text-violet-300' : 'text-violet-700'
          )}
        >
          100% 환불 보장
        </p>
        <p
          className={cn(
            'text-xs mt-0.5',
            isDark ? 'text-violet-400/70' : 'text-violet-600/70'
          )}
        >
          결과물이 마음에 들지 않으면 전액 환불해 드려요
        </p>
      </div>
    </div>
  );
}
