'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AuroraBackgroundProps {
  /** Aurora intensity (0-1), affects layer opacity */
  intensity?: number;
  /** Color hue preset */
  hue?: 'classic' | 'romantic' | 'custom';
  /** Enable spotlight masking effect */
  spotlight?: boolean;
  /** Spotlight center position as percentage (0-100) */
  spotlightPosition?: { x: number; y: number };
  /** Manually disable animation */
  disableAnimation?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Content to overlay on aurora */
  children?: React.ReactNode;
}

interface AuroraLayer {
  id: string;
  color: string;
  position: string;
  size: string;
  delay: string;
}

const ROMANTIC_LAYERS: AuroraLayer[] = [
  {
    id: 'indigo',
    color: 'var(--color-aurora-indigo)',
    position: '-top-20 -right-20',
    size: 'w-[600px] h-[600px]',
    delay: '0s',
  },
  {
    id: 'purple',
    color: 'var(--color-aurora-purple)',
    position: '-bottom-32 -left-32',
    size: 'w-[500px] h-[500px]',
    delay: '-22.5s',
  },
  {
    id: 'pink',
    color: 'var(--color-aurora-pink)',
    position: 'top-1/3 right-1/4',
    size: 'w-[400px] h-[400px]',
    delay: '-45s',
  },
  {
    id: 'violet',
    color: 'var(--color-aurora-violet)',
    position: 'bottom-1/4 left-1/3',
    size: 'w-[450px] h-[450px]',
    delay: '-67.5s',
  },
];

const CLASSIC_LAYERS: AuroraLayer[] = [
  {
    id: 'teal',
    color: 'var(--color-aurora-teal)',
    position: '-top-20 -right-20',
    size: 'w-96 h-96',
    delay: '0s',
  },
  {
    id: 'lilac',
    color: 'var(--color-aurora-lilac)',
    position: '-bottom-32 -left-32',
    size: 'w-80 h-80',
    delay: '-22.5s',
  },
  {
    id: 'warm',
    color: 'var(--color-aurora-warm)',
    position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    size: 'w-[500px] h-[500px]',
    delay: '-45s',
  },
  {
    id: 'teal-secondary',
    color: 'var(--color-aurora-teal)',
    position: 'bottom-1/4 right-1/4',
    size: 'w-72 h-72',
    delay: '-67.5s',
  },
];

export function AuroraBackground({
  intensity = 0.5,
  hue = 'romantic',
  spotlight = false,
  spotlightPosition = { x: 50, y: 50 },
  disableAnimation = false,
  className,
  children,
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(true);

  // Use IntersectionObserver for viewport awareness
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const shouldAnimate = !disableAnimation && !prefersReducedMotion && isInView;
  const layers = hue === 'classic' ? CLASSIC_LAYERS : ROMANTIC_LAYERS;

  // Calculate opacity based on intensity (base 0.06-0.12 range scaled by intensity)
  const baseOpacity = 0.06 + intensity * 0.06;

  return (
    <div
      ref={containerRef}
      data-testid="aurora-background"
      data-intensity={intensity}
      data-hue={hue}
      data-spotlight={spotlight ? 'true' : undefined}
      data-reduced-motion={prefersReducedMotion ? 'true' : undefined}
      data-animated={shouldAnimate ? 'true' : 'false'}
      data-in-view={isInView ? 'true' : 'false'}
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      style={{
        '--aurora-duration': '90s',
        '--spotlight-x': spotlight ? `${spotlightPosition.x}%` : undefined,
        '--spotlight-y': spotlight ? `${spotlightPosition.y}%` : undefined,
        '--aurora-opacity-start': baseOpacity,
        '--aurora-opacity-mid': baseOpacity * 1.33,
        '--aurora-opacity-end': baseOpacity * 1.67,
      } as React.CSSProperties}
    >
      {/* Base gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(14,27,42,0.03) 100%)',
        }}
      />

      {/* Aurora layers */}
      {layers.map((layer) => (
        <div
          key={layer.id}
          data-testid={`aurora-layer-${layer.id}`}
          className={cn(
            'absolute rounded-full',
            layer.position,
            layer.size,
            shouldAnimate && 'animate-aurora-wave-slow'
          )}
          style={{
            background: `radial-gradient(circle, ${layer.color} 0%, transparent 70%)`,
            opacity: baseOpacity,
            animationDelay: layer.delay,
            animationPlayState: shouldAnimate ? 'running' : 'paused',
          }}
        />
      ))}

      {/* Spotlight mask overlay */}
      {spotlight && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 50% at var(--spotlight-x) var(--spotlight-y), transparent 0%, rgba(14,27,42,0.4) 100%)`,
          }}
        />
      )}

      {/* Children content */}
      {children}
    </div>
  );
}
