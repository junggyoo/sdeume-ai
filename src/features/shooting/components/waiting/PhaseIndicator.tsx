'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PHASE_COLORS, type WaitingPhase } from '../../constants';

interface PhaseIndicatorProps {
  currentPhase: WaitingPhase;
  className?: string;
}

const PHASE_ORDER: WaitingPhase[] = ['learning', 'generating', 'complete'];

export function PhaseIndicator({ currentPhase, className }: PhaseIndicatorProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className={cn('flex items-center justify-center gap-0', className)}>
      {PHASE_ORDER.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === PHASE_ORDER.length - 1;
        
        const phaseColor = PHASE_COLORS[
          phase === 'learning' ? 'purple' : phase === 'generating' ? 'amber' : 'emerald'
        ];

        return (
          <div key={phase} className="flex items-center">
            {/* Dot */}
            <motion.div
              className={cn(
                'relative flex items-center justify-center',
                'w-3 h-3 rounded-full',
                'transition-colors duration-300'
              )}
              initial={false}
              animate={{
                scale: isCurrent ? 1.2 : 1,
                backgroundColor: isCompleted || isCurrent
                  ? phaseColor.stroke
                  : 'rgba(255, 255, 255, 0.3)',
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Glow effect for current phase */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: phaseColor.stroke }}
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>

            {/* Connector line */}
            {!isLast && (
              <div className="relative w-16 h-0.5 mx-1">
                {/* Background line */}
                <div className="absolute inset-0 bg-white/20 rounded-full" />
                
                {/* Progress line */}
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: phaseColor.stroke }}
                  initial={{ width: '0%' }}
                  animate={{
                    width: isCompleted ? '100%' : isCurrent ? '50%' : '0%',
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
