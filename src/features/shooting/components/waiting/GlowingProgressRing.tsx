'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Camera, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PHASE_COLORS, type WaitingPhase } from '../../constants';

interface GlowingProgressRingProps {
  progress: number;
  phase: WaitingPhase;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const ICONS = {
  Wand2,
  Camera,
  CheckCircle,
} as const;

export function GlowingProgressRing({
  progress,
  phase,
  size = 200,
  strokeWidth = 8,
  className,
}: GlowingProgressRingProps) {
  const colors = PHASE_COLORS[phase === 'learning' ? 'purple' : phase === 'generating' ? 'amber' : 'emerald'];
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const IconComponent = useMemo(() => {
    if (phase === 'learning') return ICONS.Wand2;
    if (phase === 'generating') return ICONS.Camera;
    return ICONS.CheckCircle;
  }, [phase]);

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      {/* Glow effect background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Progress Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10 -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 10px ${colors.glow})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <IconComponent
            className={cn('w-8 h-8 mb-2', colors.textClass)}
            strokeWidth={1.5}
          />
        </motion.div>
        <motion.span
          key={progress}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold text-white"
        >
          {Math.round(progress)}%
        </motion.span>
      </div>

      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: colors.stroke,
          boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
        }}
        animate={{
          boxShadow: [
            `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
            `0 0 50px ${colors.glow}, 0 0 100px ${colors.glow}`,
            `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
