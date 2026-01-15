'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SCAN_MESSAGES = [
  'AI 작가님이 조명을 체크하고 있어요...',
  '구도를 분석하고 있어요...',
  '최적의 크롭 포인트를 찾고 있어요...',
  '거의 다 됐어요!',
];

interface ScannerOverlayProps {
  isScanning: boolean;
  progress?: number;
  className?: string;
}

export function ScannerOverlay({
  isScanning,
  progress = 0,
  className,
}: ScannerOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cycle through messages
  useEffect(() => {
    if (!isScanning) {
      setMessageIndex(0);
      setShowMessage(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setShowMessage(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % SCAN_MESSAGES.length);
        setShowMessage(true);
      }, 200);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isScanning]);

  if (!isScanning) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-black/60 backdrop-blur-sm',
          className
        )}
      >
        <div className="text-center text-white">
          {/* Animated Icon */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-accent-teal" />
          </motion.div>

          {/* Message */}
          <AnimatePresence mode="wait">
            {showMessage && (
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium"
              >
                {SCAN_MESSAGES[messageIndex]}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="mt-6 w-64 mx-auto">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-accent-teal"
                />
              </div>
              <p className="text-sm text-white/60 mt-2">{Math.round(progress)}%</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
