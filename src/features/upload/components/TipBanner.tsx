import { memo, useState, useCallback } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TipBannerProps {
  title?: string;
  tip?: string;
  variant?: 'default' | 'success' | 'warning';
  dismissible?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    gradient: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/30',
    icon: 'text-violet-400',
    title: 'text-violet-300',
  },
  success: {
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    title: 'text-emerald-300',
  },
  warning: {
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
    title: 'text-amber-300',
  },
};

export const TipBanner = memo(function TipBanner({
  title = '팁',
  tip = '20장이면 완벽해요! 다양한 각도의 얼굴 사진을 올려주세요.',
  variant = 'default',
  dismissible = false,
  className,
}: TipBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  if (isDismissed) return null;

  const styles = variantStyles[variant];

  return (
    <div
      role="note"
      className={cn(
        'relative px-4 py-3 rounded-xl border',
        'bg-gradient-to-r',
        styles.gradient,
        styles.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          <Lightbulb className="w-5 h-5" data-testid="tip-icon" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', styles.title)}>{title}</p>
          <p className="text-sm text-slate-300 mt-0.5">{tip}</p>
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-300"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});
