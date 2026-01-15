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
  className,
}: StickyCTAProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white border-t border-gray-200',
        'px-4 py-3 md:px-6 md:py-4',
        'shadow-up',
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
            className="flex-1 md:flex-none md:min-w-[120px]"
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
            'bg-primary-mobile hover:bg-primary-hover'
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
