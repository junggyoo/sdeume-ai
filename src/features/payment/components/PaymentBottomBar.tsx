'use client';

import { Button } from '@/components/ui/button';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import type { Package } from '../types';

interface PaymentBottomBarProps {
  selectedPackage: Package | null;
  onPayment: () => void;
  isProcessing: boolean;
  canProceed: boolean;
}

export function PaymentBottomBar({
  selectedPackage,
  onPayment,
  isProcessing,
  canProceed,
}: PaymentBottomBarProps) {
  if (!selectedPackage) {
    return null;
  }

  return (
    <div
      data-testid="payment-bottom-bar"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-4 py-4 md:px-6"
    >
      <div className="max-w-5xl mx-auto">
        {/* Mobile Layout: 2 rows */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {selectedPackage.name} 패키지
              </span>
              <span className="text-slate-500 text-sm line-through">
                {selectedPackage.originalPrice.toLocaleString()}원
              </span>
              <span className="text-rose-400 text-xs font-medium">
                {selectedPackage.discount}% 할인
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-amber-400">
              {selectedPackage.price.toLocaleString()}원
            </span>
            <Button
              size="lg"
              onClick={onPayment}
              disabled={!canProceed || isProcessing}
              aria-busy={isProcessing}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  결제 처리 중...
                </>
              ) : (
                <>
                  결제하고 촬영 시작
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Desktop Layout: 1 row */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-medium text-lg">
              {selectedPackage.name} 패키지
            </span>
            <span className="text-slate-500 line-through">
              {selectedPackage.originalPrice.toLocaleString()}원
            </span>
            <span className="text-rose-400 text-sm font-medium">
              {selectedPackage.discount}% 할인
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-2xl font-bold text-amber-400">
              {selectedPackage.price.toLocaleString()}원
            </span>
            <Button
              size="lg"
              onClick={onPayment}
              disabled={!canProceed || isProcessing}
              aria-busy={isProcessing}
              className="min-w-[200px] bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  결제 처리 중...
                </>
              ) : (
                <>
                  결제하고 촬영 시작
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
