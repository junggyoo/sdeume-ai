'use client';

import { ShieldCheck } from 'lucide-react';
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
          ? 'bg-emerald-900/50 border border-emerald-700/50'
          : 'bg-emerald-50 border border-emerald-200'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isDark ? 'bg-emerald-800' : 'bg-emerald-100'
        )}
      >
        <ShieldCheck
          className={cn(
            'w-4 h-4',
            isDark ? 'text-emerald-400' : 'text-emerald-600'
          )}
        />
      </div>
      <div>
        <p
          className={cn(
            'font-bold text-sm',
            isDark ? 'text-emerald-300' : 'text-emerald-700'
          )}
        >
          100% 환불 보장
        </p>
        <p
          className={cn(
            'text-xs mt-0.5',
            isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'
          )}
        >
          결과물이 마음에 들지 않으면 전액 환불해 드려요
        </p>
      </div>
    </div>
  );
}
