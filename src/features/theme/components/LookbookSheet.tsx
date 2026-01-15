'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Theme } from '../types';

interface LookbookSheetProps {
  theme: Theme;
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export function LookbookSheet({ theme, isOpen, onClose, onSelect }: LookbookSheetProps) {
  // 샘플 이미지 (DB에 없으면 플레이스홀더 사용)
  const images = theme.sampleImages.length > 0
    ? theme.sampleImages
    : Array.from({ length: 8 }, (_, i) => `/images/themes/${theme.slug}/sample-${i + 1}.jpg`);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 flex items-center justify-between border-b">
              <div>
                <h3 className="font-semibold text-lg text-primary-desktop">
                  {theme.name}
                </h3>
                <p className="text-sm text-gray-600">룩북 미리보기</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Image Grid */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {images.map((src, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg overflow-hidden bg-gray-100',
                      index === 0 && 'col-span-2 row-span-2'
                    )}
                  >
                    <img
                      src={src}
                      alt={`${theme.name} 샘플 ${index + 1}`}
                      className="w-full h-full object-cover aspect-square"
                      onError={(e) => {
                        // 이미지 로드 실패 시 플레이스홀더
                        (e.target as HTMLImageElement).src = '/images/placeholder-theme.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t bg-white">
              <Button
                onClick={onSelect}
                className="w-full h-12 bg-primary-desktop hover:bg-primary-desktop/90"
              >
                <Check className="w-5 h-5 mr-2" />
                이 테마 선택하기
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
