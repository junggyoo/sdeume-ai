'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TIMING } from '../../constants';

interface RollingTextProps {
  messages: readonly string[];
  className?: string;
}

export function RollingText({ messages, className }: RollingTextProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (messages.length === 0) return;

    intervalRef.current = setInterval(() => {
      setShowMessage(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setShowMessage(true);
      }, TIMING.messageTransition);
    }, TIMING.messageRotation);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className={cn('h-6 flex items-center justify-center', className)}>
      <AnimatePresence mode="wait">
        {showMessage && (
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-white/60 text-center"
          >
            {messages[messageIndex]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
