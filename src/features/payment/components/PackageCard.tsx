'use client';

import { cn } from '@/lib/utils';
import { Check, Image, RotateCcw, Palette, Crown } from 'lucide-react';
import type { Package } from '../types';
import { MultiThemeNotice } from './MultiThemeNotice';

interface PackageCardProps {
  pkg: Package;
  isSelected: boolean;
  onSelect: (packageId: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  RotateCcw,
  Palette,
  Crown,
};

export function PackageCard({ pkg, isSelected, onSelect }: PackageCardProps) {
  const showMultiThemeNotice = pkg.themeCount > 1;

  return (
    <button
      type="button"
      onClick={() => onSelect(pkg.id)}
      className={cn(
        'relative flex flex-col p-6 rounded-2xl transition-all duration-200',
        'bg-slate-800/50 border border-slate-700',
        'hover:bg-slate-800/70',
        'text-left w-full',
        isSelected && 'ring-4 ring-amber-400 border-amber-400/50 scale-[1.02]'
      )}
    >
      {/* BEST 뱃지 */}
      {pkg.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
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

      {/* 가격 */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {pkg.price.toLocaleString()}
          </span>
          <span className="text-lg text-slate-400">원</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-slate-500 line-through">
            {pkg.originalPrice.toLocaleString()}원
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400">
            {pkg.discount}% OFF
          </span>
        </div>
      </div>

      {/* 기능 목록 */}
      <ul className="space-y-3 flex-1">
        {pkg.features.map((feature) => {
          const IconComponent = iconMap[feature.icon];
          return (
            <li key={feature.text} className="flex items-center gap-3">
              {IconComponent && (
                <IconComponent className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-sm text-slate-300">{feature.text}</span>
            </li>
          );
        })}
      </ul>

      {/* 멀티테마 안내 */}
      {showMultiThemeNotice && (
        <div className="mt-4">
          <MultiThemeNotice themeCount={pkg.themeCount} />
        </div>
      )}
    </button>
  );
}
