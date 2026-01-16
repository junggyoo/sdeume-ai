'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 처리 중 표시 메시지
 */
const PROCESSING_MESSAGES = [
  '사진을 정리하고 있어요...',
  '장면을 구성하고 있어요...',
  'Ken Burns 효과 적용 중...',
  '영상을 편집하고 있어요...',
  '거의 다 됐어요...',
] as const;

/**
 * 메시지 회전 간격 (ms)
 */
const MESSAGE_ROTATION_INTERVAL = 2500;

export interface MovieProcessingModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 진행률 (0-100) */
  progress: number;
  /** 취소 핸들러 */
  onCancel: () => void;
}

/**
 * 영상 생성 중 프로세싱 모달
 *
 * 필름 릴 애니메이션과 프로그레스 바, 롤링 메시지 표시
 */
export function MovieProcessingModal({
  isOpen,
  progress,
  onCancel,
}: MovieProcessingModalProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // 메시지 회전
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, MESSAGE_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isOpen]);

  // 진행률에 따른 메시지 인덱스 조정
  useEffect(() => {
    if (progress >= 90) {
      setMessageIndex(PROCESSING_MESSAGES.length - 1);
    }
  }, [progress]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 mx-4 w-full max-w-sm rounded-card bg-white p-6 shadow-xl"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="취소"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Film Reel Animation */}
          <div className="relative mb-6">
            <div className="animate-spin-slow rounded-full border-4 border-accent-rose/20 p-4">
              <Film className="h-12 w-12 text-accent-rose" />
            </div>
            {/* Spinning outer ring */}
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent-rose" />
          </div>

          {/* Title */}
          <h3
            id="processing-modal-title"
            className="mb-2 font-serif text-lg font-bold text-primary-desktop"
          >
            영상 제작 중
          </h3>

          {/* Rotating Message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-6 text-sm text-gray-600"
            >
              {PROCESSING_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="mb-2 w-full">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                data-testid="progress-bar-fill"
                className="h-full rounded-full bg-accent-rose transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Progress Percentage */}
          <p className="text-sm font-semibold text-accent-rose">{progress}%</p>
        </div>
      </motion.div>
    </div>
  );
}
