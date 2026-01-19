'use client';

import { cn } from '@/lib/utils';
import Check from 'lucide-react/dist/esm/icons/check';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import type { PaymentMethod } from '../types';

interface PaymentMethodButtonProps {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: (methodId: string) => void;
}

const colorIconMap: Record<string, { bg: string; icon: React.ReactNode }> = {
  slate: {
    bg: 'bg-slate-500',
    icon: <CreditCard className="w-4 h-4 text-white" />,
  },
  yellow: {
    bg: 'bg-yellow-400',
    icon: null,
  },
  green: {
    bg: 'bg-green-500',
    icon: null,
  },
  blue: {
    bg: 'bg-blue-500',
    icon: null,
  },
};

export function PaymentMethodButton({
  method,
  isSelected,
  onSelect,
}: PaymentMethodButtonProps) {
  const colorConfig = colorIconMap[method.color] || colorIconMap.slate;

  return (
    <button
      type="button"
      onClick={() => onSelect(method.id)}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
        'bg-slate-800/50 border',
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-500/10 shadow-lg'
          : 'border-slate-700 hover:border-slate-600'
      )}
    >
      {/* 색상 아이콘 */}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          colorConfig.bg
        )}
      >
        {colorConfig.icon}
      </div>

      {/* 결제 수단 이름 */}
      <span className="text-sm font-medium text-white">{method.name}</span>

      {/* 선택 체크 */}
      {isSelected && (
        <Check className="w-4 h-4 text-emerald-400 ml-auto" />
      )}
    </button>
  );
}
