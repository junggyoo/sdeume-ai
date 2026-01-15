'use client';

import { cn } from '@/lib/utils';

interface ShimmerOverlayProps {
  className?: string;
}

export function ShimmerOverlay({ className }: ShimmerOverlayProps) {
  return (
    <div
      data-testid="shimmer-overlay"
      className={cn(
        'absolute inset-0 overflow-hidden rounded-image',
        className
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
          animation: 'light-sweep 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}
