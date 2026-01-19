'use client';

import { cn } from '@/lib/utils';
import Check from 'lucide-react/dist/esm/icons/check';
import type { Package } from '../types';
import { MultiThemeNotice } from './MultiThemeNotice';

interface PackageCardProps {
  pkg: Package;
  isSelected: boolean;
  onSelect: (packageId: string) => void;
}

function getDiscountBadgeStyle(discount: number) {
  if (discount >= 33) {
    return 'bg-rose-500/20 text-rose-400';
  }
  if (discount >= 25) {
    return 'bg-amber-500/20 text-amber-400';
  }
  return 'bg-emerald-500/20 text-emerald-400';
}

export function PackageCard({ pkg, isSelected, onSelect }: PackageCardProps) {
  const showMultiThemeNotice = pkg.themeCount > 1;

  return (
    <button
      type="button"
      onClick={() => onSelect(pkg.id)}
      className={cn(
        'relative flex flex-col p-6 rounded-2xl transition-all duration-200',
        'bg-slate-800/50 border',
        'hover:bg-slate-800/70',
        'text-left w-full',
        isSelected
          ? 'bg-gradient-to-br from-amber-900/40 to-amber-950/60 border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
          : 'border-slate-700'
      )}
    >
      {/* BEST 뱃지 */}
      {pkg.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-emerald-500">
          BEST
        </div>
      )}

      {/* 선택 체크 표시 */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
          <Check className="w-4 h-4 text-slate-900" />
        </div>
      )}

      {/* 패키지 이름 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
        <p className="text-sm text-slate-400">{pkg.nameKr}</p>
      </div>

      {/* 가격 - 세로 배치 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-slate-500 line-through">
            {pkg.originalPrice.toLocaleString()}원
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              getDiscountBadgeStyle(pkg.discount)
            )}
          >
            {pkg.discount}% OFF
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {pkg.price.toLocaleString()}
          </span>
          <span className="text-lg text-slate-400">원</span>
        </div>
      </div>

      {/* 기능 목록 - emoji 렌더링 */}
      <ul className="space-y-3 flex-1">
        {pkg.features.map((feature) => (
          <li key={feature.text} className="flex items-center gap-3">
            <span className="text-base">{feature.icon}</span>
            <span className="text-sm text-slate-300">{feature.text}</span>
          </li>
        ))}
      </ul>

      {/* 멀티테마 안내 */}
      {showMultiThemeNotice && (
        <div className="mt-4">
          <MultiThemeNotice themeCount={pkg.themeCount} isSelected={isSelected} />
        </div>
      )}
    </button>
  );
}
