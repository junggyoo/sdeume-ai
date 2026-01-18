'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

interface ProgressInfo {
  brideCount: number;
  groomCount: number;
  maxPhotos: number;
}

interface SelectedThemeInfo {
  name: string;
  bgColor: string;
}

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
  progress?: ProgressInfo;
  selectedTheme?: SelectedThemeInfo;
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
  progress,
  selectedTheme,
  className,
}: StickyCTAProps) {
  const isDark = variant === 'dark';

  return (
    <div
      data-testid="sticky-cta"
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
        {/* Left side - Back Button, Selected Theme, or Progress */}
        <div className="flex items-center gap-3">
          {showBack && onBack && (
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              disabled={isBackDisabled || isLoading}
              className={cn(
                'md:min-w-[120px]',
                isDark &&
                  'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-slate-100'
              )}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {backLabel}
            </Button>
          )}

          {/* Selected Theme Info (dark variant only) */}
          {isDark && selectedTheme && (
            <div className="hidden md:flex items-center gap-3">
              <div
                data-testid="theme-thumbnail"
                className={cn(
                  'w-10 h-10 rounded-lg',
                  selectedTheme.bgColor
                )}
              />
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">선택한 컨셉</span>
                <span className="text-sm font-medium text-white">
                  {selectedTheme.name}
                </span>
              </div>
            </div>
          )}

          {/* Progress Info */}
          {progress && isDark && !selectedTheme && (
            <div className="hidden md:flex items-center gap-4 text-sm text-slate-400">
              <span>
                👰 신부 <span className="text-slate-200 font-medium">{progress.brideCount}/{progress.maxPhotos}장</span>
              </span>
              <span>
                🤵 신랑 <span className="text-slate-200 font-medium">{progress.groomCount}/{progress.maxPhotos}장</span>
              </span>
            </div>
          )}
        </div>

        {/* Spacer for single button alignment */}
        {(!showBack || !onBack) && !progress && !selectedTheme && <div />}

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
