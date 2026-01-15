'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ShimmerOverlay } from './ShimmerOverlay';
import { DROP_ANIMATION, BLUR_STAGES, TIMING, type BlurStage } from '../constants';
import type { GenerationImage } from '@/features/generation/types';

interface DropImageProps {
  image: GenerationImage;
  index: number;
  onDropComplete?: () => void;
}

export function DropImage({ image, index, onDropComplete }: DropImageProps) {
  const [blurState, setBlurState] = useState<BlurStage>('dropping');

  // Staged reveal: dropping -> processing -> revealed
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setBlurState('processing');
    }, TIMING.blurToProcessing);

    const timer2 = setTimeout(() => {
      setBlurState('revealed');
      onDropComplete?.();
    }, TIMING.processingToRevealed);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onDropComplete]);

  return (
    <motion.div
      data-testid="drop-image"
      initial={DROP_ANIMATION.initial}
      animate={DROP_ANIMATION.animate}
      transition={DROP_ANIMATION.transition}
      style={{
        zIndex: index,
        marginTop: index > 0 ? '-20px' : 0,
      }}
      className="relative"
    >
      <div
        data-testid="blur-container"
        className="relative w-32 h-40 rounded-image overflow-hidden shadow-md bg-gray-800"
        style={{
          filter: BLUR_STAGES[blurState],
          transition: 'filter 350ms ease-out',
        }}
      >
        <Image
          src={image.url}
          alt={`Generated image ${index + 1}`}
          fill
          className="object-cover"
          sizes="128px"
        />

        {/* Shimmer overlay during processing */}
        {blurState === 'processing' && <ShimmerOverlay />}
      </div>
    </motion.div>
  );
}
