'use client';

import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  className?: string;
}

export function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div
      data-testid="aurora-background"
      className={cn('fixed inset-0 pointer-events-none', className)}
    >
      {/* Base Deep Navy background */}
      <div className="absolute inset-0 bg-primary-desktop" />

      {/* Aurora Hue - Teal (Top Right) */}
      <div
        className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.08] motion-safe:animate-[aurora-float_8s_ease-in-out_infinite_alternate]"
        style={{
          background:
            'radial-gradient(circle, rgba(134, 227, 255, 1) 0%, transparent 70%)',
        }}
      />

      {/* Aurora Hue - Lilac (Bottom Left) */}
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-[0.08] motion-safe:animate-[aurora-float_10s_ease-in-out_infinite_alternate-reverse]"
        style={{
          background:
            'radial-gradient(circle, rgba(199, 185, 255, 1) 0%, transparent 70%)',
        }}
      />

      {/* Aurora Hue - Warm Glow (Center) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06] motion-safe:animate-[aurora-float_12s_ease-in-out_infinite_alternate]"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 214, 165, 1) 0%, transparent 60%)',
        }}
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(14,27,42,0) 0%, rgba(14,27,42,0.3) 100%)',
        }}
      />
    </div>
  );
}
