'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { REVEAL_TIMING, SEAL_ANIMATION, ENVELOPE_ANIMATION, LIGHT_BLOOM_ANIMATION } from '../constants';

export interface WaxSealEnvelopeProps {
  isOpened: boolean;
  onOpen: () => void;
  onOpenComplete?: () => void;
  className?: string;
}

export function WaxSealEnvelope({
  isOpened,
  onOpen,
  onOpenComplete,
  className,
}: WaxSealEnvelopeProps) {
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 애니메이션 완료 후 콜백 호출
  useEffect(() => {
    if (isOpened && onOpenComplete) {
      const totalDuration =
        REVEAL_TIMING.sealBreak +
        REVEAL_TIMING.envelopeOpen +
        REVEAL_TIMING.lightBloom +
        REVEAL_TIMING.galleryFade;

      animationTimeoutRef.current = setTimeout(() => {
        onOpenComplete();
      }, totalDuration);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isOpened, onOpenComplete]);

  const handleSealClick = () => {
    if (!isOpened) {
      onOpen();
    }
  };

  return (
    <motion.div
      data-testid="wax-seal-envelope"
      className={cn(
        'relative flex items-center justify-center',
        className
      )}
      initial={{ opacity: 1 }}
      animate={{ opacity: isOpened ? 0 : 1 }}
      transition={{
        duration: REVEAL_TIMING.galleryFade / 1000,
        delay: isOpened ? (REVEAL_TIMING.sealBreak + REVEAL_TIMING.envelopeOpen + REVEAL_TIMING.lightBloom) / 1000 : 0
      }}
    >
      {/* 봉투 본체 */}
      <div
        data-testid="envelope-body"
        className="relative w-72 h-48 md:w-96 md:h-64"
      >
        {/* 봉투 배경 - 크림색 */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-secondary to-[#EDE5DA] shadow-md" />

        {/* 봉투 안쪽 (어두운 영역) */}
        <div className="absolute inset-x-4 top-4 bottom-0 rounded-t-lg bg-primary-desktop/5" />

        {/* 봉투 플랩 (상단 삼각형) */}
        <motion.div
          data-testid="envelope-flap"
          className="absolute -top-1 left-0 right-0 h-24 md:h-32"
          style={{
            transformOrigin: 'top center',
            perspective: '1000px',
          }}
          initial={ENVELOPE_ANIMATION.initial}
          animate={isOpened ? ENVELOPE_ANIMATION.open : ENVELOPE_ANIMATION.initial}
          transition={ENVELOPE_ANIMATION.transition}
        >
          {/* 플랩 삼각형 SVG */}
          <svg
            viewBox="0 0 384 128"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="flapGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#F6F1EA" />
                <stop offset="100%" stopColor="#EDE5DA" />
              </linearGradient>
            </defs>
            <path
              d="M0,128 L192,20 L384,128 L0,128 Z"
              fill="url(#flapGradient)"
              className="drop-shadow-sm"
            />
          </svg>
        </motion.div>

        {/* 왁스 실링 버튼 */}
        {!isOpened && (
          <motion.button
            data-testid="wax-seal-button"
            aria-label="봉투 열기"
            className={cn(
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10',
              'w-16 h-16 md:w-20 md:h-20 rounded-full',
              'bg-accent-rose shadow-md',
              'flex items-center justify-center',
              'cursor-pointer transition-transform hover:scale-105 active:scale-95',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-rose focus-visible:ring-offset-2'
            )}
            onClick={handleSealClick}
            initial={SEAL_ANIMATION.initial}
            animate={isOpened ? SEAL_ANIMATION.breaking : SEAL_ANIMATION.initial}
            transition={SEAL_ANIMATION.transition}
          >
            {/* 실링 문양 */}
            <div className="text-white font-serif text-xl md:text-2xl font-bold opacity-80">
              S
            </div>
            {/* 실링 테두리 장식 */}
            <div className="absolute inset-1 rounded-full border-2 border-white/30" />
          </motion.button>
        )}
      </div>

      {/* Light Bloom 효과 */}
      <AnimatePresence>
        {isOpened && (
          <motion.div
            data-testid="light-bloom"
            className="absolute inset-0 pointer-events-none"
            initial={LIGHT_BLOOM_ANIMATION.initial}
            animate={LIGHT_BLOOM_ANIMATION.animate}
            exit={{ opacity: 0 }}
            transition={LIGHT_BLOOM_ANIMATION.transition}
          >
            <div className="absolute inset-0 bg-gradient-radial from-white/60 via-white/20 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 안내 텍스트 */}
      {!isOpened && (
        <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm text-gray-500 whitespace-nowrap animate-fade-in">
          실링을 눌러 화보를 확인하세요
        </p>
      )}
    </motion.div>
  );
}
