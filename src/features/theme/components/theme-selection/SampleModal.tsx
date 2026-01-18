'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import type { ThemeWithUI } from '../../types';

interface SampleModalProps {
  theme: ThemeWithUI | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
}

const DISPLAY_IMAGE_COUNT = 9;

export function SampleModal({
  theme,
  isOpen,
  onClose,
  onSelect,
}: SampleModalProps) {
  if (!isOpen || !theme) {
    return null;
  }

  const displayImages = theme.sampleImages.slice(0, DISPLAY_IMAGE_COUNT);
  const remainingCount = theme.sampleImages.length - DISPLAY_IMAGE_COUNT;

  const handleBackdropClick = () => {
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      <div
        data-testid="sample-modal"
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          data-testid="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          data-testid="modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={handleContentClick}
          className={cn(
            'relative z-10 w-full max-w-md',
            'bg-slate-800 rounded-3xl',
            'overflow-hidden shadow-2xl'
          )}
        >
          {/* Header */}
          <div className="relative p-5 pb-3">
            {/* Close Button */}
            <button
              data-testid="close-button"
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4',
                'w-8 h-8 rounded-full',
                'bg-white/10 hover:bg-white/20',
                'flex items-center justify-center',
                'transition-colors'
              )}
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Theme Info */}
            <h2 className="text-xl font-bold text-white pr-10">{theme.name}</h2>
            <p className="text-sm text-white/70 mt-1">{theme.ui.tagline}</p>
          </div>

          {/* Image Grid */}
          <div className="px-5 pb-3">
            <div
              data-testid="image-grid"
              className="grid grid-cols-3 gap-2"
            >
              {displayImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-700"
                >
                  <img
                    src={imageUrl}
                    alt={`${theme.name} 샘플 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* More Images Text */}
            {remainingCount > 0 && (
              <p className="text-center text-sm text-white/50 mt-3">
                + {remainingCount}장 더 보기
              </p>
            )}
          </div>

          {/* CTA Button */}
          <div className="p-5 pt-3">
            <button
              onClick={onSelect}
              className={cn(
                'w-full py-3.5 rounded-xl',
                'bg-violet-600 hover:bg-violet-500',
                'text-white font-semibold',
                'transition-colors'
              )}
            >
              이 테마로 선택하기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
