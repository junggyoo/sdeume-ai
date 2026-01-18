'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface StickyCTAProps {
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isNextDisabled?: boolean;
  isBackDisabled?: boolean;
  isLoading?: boolean;
  showBack?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export function StickyCTA({
  onNext,
  onBack,
  nextLabel = '다음으로',
  backLabel = '이전',
  isNextDisabled = false,
  isBackDisabled = false,
  isLoading = false,
  showBack = true,
  variant = 'light',
  className,
}: StickyCTAProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'px-4 py-3 md:px-6 md:py-4',
        'shadow-up',
        isDark
          ? 'bg-slate-900/95 border-t border-slate-700 backdrop-blur-sm'
          : 'bg-white border-t border-gray-200',
        className
      )}
    >
      <div className="max-w-[1040px] mx-auto flex items-center justify-between gap-3">
        {/* Back Button */}
        {showBack && onBack && (
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={isBackDisabled || isLoading}
            className={cn(
              'flex-1 md:flex-none md:min-w-[120px]',
              isDark &&
                'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-slate-100'
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {backLabel}
          </Button>
        )}

        {/* Spacer for single button alignment */}
        {(!showBack || !onBack) && <div />}

        {/* Next Button */}
        <Button
          size="lg"
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
          className={cn(
            'flex-1 md:flex-none md:min-w-[200px]',
            isDark
              ? 'bg-violet-600 hover:bg-violet-500 text-white'
              : 'bg-primary-mobile hover:bg-primary-hover'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
