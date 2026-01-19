'use client';

import { cn } from '@/lib/utils';
import Check from 'lucide-react/dist/esm/icons/check';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import { AnimatePresence, motion } from 'framer-motion';
import type { Package } from '../types';
import { MultiThemeNotice } from './MultiThemeNotice';

interface MobilePackageCardProps {
  pkg: Package;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (packageId: string) => void;
  onToggleExpand: (packageId: string) => void;
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

export function MobilePackageCard({
  pkg,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: MobilePackageCardProps) {
  const showMultiThemeNotice = pkg.themeCount > 1;

  const handleClick = () => {
    onSelect(pkg.id);
    if (!isExpanded) {
      onToggleExpand(pkg.id);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(pkg.id);
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200 overflow-hidden',
        'border',
        isSelected
          ? 'bg-gradient-to-br from-amber-900/40 to-amber-950/60 border-2 border-amber-400 shadow-lg shadow-amber-500/20'
          : 'bg-slate-800/50 border-slate-700'
      )}
    >
      {/* Header - 항상 표시 */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {/* 라디오 버튼 스타일 */}
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              isSelected
                ? 'border-amber-400 bg-amber-400'
                : 'border-slate-500 bg-transparent'
            )}
          >
            {isSelected && <Check className="w-3 h-3 text-slate-900" />}
          </div>

          {/* 패키지 이름 + BEST 뱃지 */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{pkg.name}</span>
            {pkg.recommended && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-emerald-500">
                BEST
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 가격 */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">
                {pkg.price.toLocaleString()}원
              </span>
            </div>
            <span
              className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded',
                getDiscountBadgeStyle(pkg.discount)
              )}
            >
              {pkg.discount}% OFF
            </span>
          </div>

          {/* 펼침/접힘 버튼 */}
          <button
            type="button"
            onClick={handleToggle}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content - 아코디언 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
              {/* 기능 목록 - emoji 렌더링 */}
              <ul className="space-y-2">
                {pkg.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <span className="text-base">{feature.icon}</span>
                    <span className="text-sm text-slate-300">
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* 멀티테마 안내 */}
              {showMultiThemeNotice && (
                <div className="mt-4">
                  <MultiThemeNotice themeCount={pkg.themeCount} isSelected={isSelected} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
