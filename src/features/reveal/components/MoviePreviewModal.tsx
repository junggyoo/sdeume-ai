'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MoviePreviewModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 비디오 URL */
  videoUrl: string | null;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 다운로드 핸들러 */
  onDownload: () => void;
}

/**
 * 영상 미리보기 모달
 *
 * 생성된 영상을 미리보기하고 다운로드할 수 있는 모달
 */
export function MoviePreviewModal({
  isOpen,
  videoUrl,
  onClose,
  onDownload,
}: MoviePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <motion.div
        data-testid="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          aria-label="닫기"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Title */}
        <h3
          id="preview-modal-title"
          className="mb-4 font-serif text-lg font-bold text-white"
        >
          영상이 완성되었어요!
        </h3>

        {/* Video Preview */}
        {videoUrl ? (
          <div className="mb-6 w-full overflow-hidden rounded-card bg-black">
            <video
              data-testid="preview-video"
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="aspect-[9/16] w-full object-contain"
            />
          </div>
        ) : (
          <div className="mb-6 flex aspect-[9/16] w-full items-center justify-center rounded-card bg-gray-800">
            <p className="text-gray-400">영상을 불러올 수 없습니다.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex-1 rounded-input border border-white/30 px-4 py-3',
              'font-sans text-sm font-semibold text-white',
              'transition-colors hover:bg-white/10'
            )}
            aria-label="닫기"
          >
            닫기
          </button>

          <button
            type="button"
            onClick={onDownload}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-input px-4 py-3',
              'font-sans text-sm font-semibold',
              'bg-white text-primary-desktop',
              'transition-colors hover:bg-gray-100'
            )}
            aria-label="다운로드"
          >
            <Download className="h-4 w-4" />
            다운로드
          </button>
        </div>
      </motion.div>
    </div>
  );
}
