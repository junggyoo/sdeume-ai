'use client';

import Image from 'next/image';
import Check from 'lucide-react/dist/esm/icons/check';
import { cn } from '@/lib/utils';
import type { Package } from '../types';
import { RefundGuarantee } from './RefundGuarantee';

interface ThemeInfo {
  id: string;
  name: string;
  thumbnailUrl: string | null;
}

interface OrderSummaryProps {
  theme: ThemeInfo | null;
  selectedPackage: Package | null;
  variant?: 'light' | 'dark';
}

export function OrderSummary({ theme, selectedPackage, variant = 'light' }: OrderSummaryProps) {
  if (!selectedPackage) {
    return null;
  }

  const discountAmount = selectedPackage.originalPrice - selectedPackage.price;
  const showMultiThemeNotice = selectedPackage.themeCount > 1;
  const isDark = variant === 'dark';

  return (
    <div className={cn(
      'rounded-2xl p-6',
      isDark
        ? 'bg-slate-800/50 border border-slate-700'
        : 'bg-white shadow-lg'
    )}>
      <h3 className={cn(
        'text-lg font-bold mb-4',
        isDark ? 'text-white' : 'text-slate-900'
      )}>주문 요약</h3>

      {/* 선택한 테마 - emerald gradient */}
      {theme && (
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-xl mb-4',
          isDark
            ? 'bg-gradient-to-r from-emerald-900/40 to-emerald-950/60 border border-emerald-700/30'
            : 'bg-emerald-50 border border-emerald-200'
        )}>
          <div className={cn(
            'w-12 h-12 rounded-lg overflow-hidden flex-shrink-0',
            isDark ? 'bg-slate-600' : 'bg-slate-200'
          )}>
            {theme.thumbnailUrl ? (
              <Image
                src={theme.thumbnailUrl}
                alt={theme.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500" />
            )}
          </div>
          <div>
            <p className={cn(
              'text-xs',
              isDark ? 'text-emerald-400/70' : 'text-emerald-600'
            )}>선택한 컨셉</p>
            <p className={cn(
              'font-medium',
              isDark ? 'text-white' : 'text-slate-900'
            )}>{theme.name}</p>
          </div>
        </div>
      )}

      {/* 패키지 정보 */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className={cn(
            isDark ? 'text-slate-300' : 'text-slate-600'
          )}>{selectedPackage.name} 패키지</span>
          <span className={cn(
            'font-medium',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            {selectedPackage.originalPrice.toLocaleString()}원
          </span>
        </div>

        {/* 패키지 기능 요약 */}
        <div className="space-y-1 pl-2">
          {selectedPackage.features.map((feature) => (
            <div key={feature.text} className={cn(
              'flex items-center gap-2 text-sm',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}>
              <Check className={cn(
                'w-3 h-3',
                isDark ? 'text-slate-500' : 'text-slate-400'
              )} />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>

        {/* 멀티테마 안내 - purple theme */}
        {showMultiThemeNotice && (
          <div className={cn(
            'mt-2 p-3 rounded-lg border',
            isDark
              ? 'bg-purple-500/10 border-purple-500/20'
              : 'bg-purple-50 border-purple-200'
          )}>
            <p className={cn(
              'text-xs',
              isDark ? 'text-purple-400/90' : 'text-purple-700'
            )}>
              ⓘ 지금 1개 선택 완료! 나머지 {selectedPackage.themeCount - 1}개는 언제든 추가 선택 가능
            </p>
          </div>
        )}
      </div>

      {/* 금액 상세 */}
      <div className={cn(
        'border-t pt-4 space-y-2',
        isDark ? 'border-slate-700' : 'border-slate-200'
      )}>
        <div className="flex justify-between text-sm">
          <span className={cn(
            isDark ? 'text-slate-400' : 'text-slate-500'
          )}>정가</span>
          <span className={cn(
            'line-through',
            isDark ? 'text-slate-500' : 'text-slate-400'
          )}>
            {selectedPackage.originalPrice.toLocaleString()}원
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={cn(
            isDark ? 'text-slate-400' : 'text-slate-500'
          )}>얼리버드 할인</span>
          <span className={cn(
            'font-medium',
            isDark ? 'text-rose-400' : 'text-rose-500'
          )}>
            -{discountAmount.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 총 결제금액 - rose color */}
      <div className={cn(
        'border-t mt-4 pt-4',
        isDark ? 'border-slate-700' : 'border-slate-200'
      )}>
        <div className="flex justify-between items-center">
          <span className={cn(
            'font-bold',
            isDark ? 'text-white' : 'text-slate-900'
          )}>총 결제금액</span>
          <span className={cn(
            'text-3xl font-bold',
            isDark ? 'text-rose-400' : 'text-rose-500'
          )}>
            {selectedPackage.price.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 환불 보장 */}
      <div className="mt-4">
        <RefundGuarantee variant={variant} />
      </div>
    </div>
  );
}
