'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PHASE_COLORS, type WaitingPhase } from '../../constants';

interface PhantomThumbsProps {
  phase: WaitingPhase;
  className?: string;
}

interface PhantomCard {
  id: number;
  size: number;
  initialX: number;
  initialY: number;
  delay: number;
  duration: number;
  rotation: number;
}

const PHANTOM_CARDS: PhantomCard[] = [
  { id: 1, size: 60, initialX: -80, initialY: 40, delay: 0, duration: 8, rotation: -8 },
  { id: 2, size: 50, initialX: 90, initialY: 60, delay: 1.5, duration: 10, rotation: 5 },
  { id: 3, size: 45, initialX: -60, initialY: -30, delay: 3, duration: 9, rotation: -3 },
  { id: 4, size: 55, initialX: 70, initialY: -50, delay: 2, duration: 7, rotation: 8 },
];

export function PhantomThumbs({ phase, className }: PhantomThumbsProps) {
  const colors = PHASE_COLORS[
    phase === 'learning' ? 'purple' : phase === 'generating' ? 'amber' : 'emerald'
  ];

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {PHANTOM_CARDS.map((card) => (
        <motion.div
          key={card.id}
          className="absolute rounded-lg"
          style={{
            width: card.size,
            height: card.size * 1.3,
            left: `calc(50% + ${card.initialX}px)`,
            top: `calc(50% + ${card.initialY}px)`,
            backgroundColor: colors.bg,
            backdropFilter: 'blur(8px)',
            border: `1px solid ${colors.stroke}30`,
          }}
          initial={{
            opacity: 0,
            y: 20,
            rotate: card.rotation,
            scale: 0.8,
          }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            y: [20, 0, -20, -40],
            rotate: [card.rotation, card.rotation * 0.5, -card.rotation * 0.5, -card.rotation],
            scale: [0.8, 1, 1, 0.9],
          }}
          transition={{
            duration: card.duration,
            delay: card.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Inner blur effect to simulate photo */}
          <div
            className="absolute inset-2 rounded"
            style={{
              background: `linear-gradient(135deg, ${colors.stroke}20 0%, ${colors.stroke}10 100%)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
