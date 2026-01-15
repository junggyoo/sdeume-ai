'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NotificationToggle } from './NotificationToggle';
import { TRAINING_MESSAGES, TIMING } from '../constants';
import type { GenerationStatus } from '@/features/generation/types';

interface TrainingProgressProps {
  status?: GenerationStatus;
  className?: string;
}

export function TrainingProgress({ status, className }: TrainingProgressProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rolling text animation - cycle through messages
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setShowMessage(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % TRAINING_MESSAGES.length);
        setShowMessage(true);
      }, TIMING.messageTransition);
    }, TIMING.messageRotation);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'flex flex-col items-center justify-center min-h-screen text-white px-6',
        className
      )}
    >
      {/* Main Microcopy */}
      <h2 className="font-serif text-xl md:text-2xl text-center mb-8 leading-relaxed">
        작가님이 두 분의 빛을 익히는 중이에요.
        <br />
        잠시만요!
      </h2>

      {/* Rolling Message */}
      <div className="h-8 mb-8">
        <AnimatePresence mode="wait">
          {showMessage && (
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-lg text-white/80"
            >
              {TRAINING_MESSAGES[messageIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Indicator */}
      <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full bg-accent-rose rounded-full"
          animate={{
            width: ['0%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Notification Toggle */}
      <NotificationToggle className="mb-6" />

      {/* Safety Message */}
      <p className="text-sm text-white/60 text-center">
        앱을 닫아도 괜찮아요.
        <br />
        완료되면 알려드릴게요.
      </p>
    </motion.div>
  );
}
