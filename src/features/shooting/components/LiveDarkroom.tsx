'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ImageTray } from './ImageTray';
import { DropImage } from './DropImage';
import { useSoundEffect } from '../hooks/useSoundEffect';
import type { GenerationImage } from '@/features/generation/types';

interface LiveDarkroomProps {
  images: GenerationImage[];
  onImageComplete?: (image: GenerationImage) => void;
  className?: string;
}

export function LiveDarkroom({
  images,
  onImageComplete,
  className,
}: LiveDarkroomProps) {
  const { playShutter } = useSoundEffect();

  const handleDropComplete = (image: GenerationImage) => {
    playShutter();
    onImageComplete?.(image);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('flex flex-col min-h-screen', className)}
    >
      {/* Status Header */}
      <div className="text-center text-white py-6 px-4">
        <p className="text-sm text-white/60">촬영 중</p>
        <p className="font-serif text-lg mt-1">
          {images.length}장의 사진이 나왔어요
        </p>
      </div>

      {/* Image Tray Area */}
      <ImageTray className="flex-1">
        <AnimatePresence>
          {images.map((image, index) => (
            <DropImage
              key={image.url}
              image={image}
              index={index}
              onDropComplete={() => handleDropComplete(image)}
            />
          ))}
        </AnimatePresence>
      </ImageTray>

      {/* Bottom Status */}
      <div className="text-center text-white/60 text-sm pb-8">
        디테일 보정 중...
      </div>
    </motion.div>
  );
}
