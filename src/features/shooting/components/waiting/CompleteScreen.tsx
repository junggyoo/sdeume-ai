'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Share2, Home, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PHASES, PHASE_COLORS } from '../../constants';
import { PhaseIndicator } from './PhaseIndicator';
import { Confetti, SparkleEffects } from './Confetti';
import type { GenerationImage } from '@/features/generation/types';

interface CompleteScreenProps {
  images: GenerationImage[];
  themeName?: string;
  onViewResults: () => void;
  onShare?: () => void;
  onHomeClick?: () => void;
  onCloseClick?: () => void;
  className?: string;
}

export function CompleteScreen({
  images,
  themeName = '스튜디오',
  onViewResults,
  onShare,
  onHomeClick,
  onCloseClick,
  className,
}: CompleteScreenProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const phaseConfig = PHASES.complete;
  const colors = PHASE_COLORS.emerald;
  
  const subtitle = phaseConfig.subtitle.replace('{count}', String(images.length));
  const thumbnailImages = images.slice(0, 8);

  useEffect(() => {
    setShowConfetti(true);
  }, []);

  return (
    <>
      <Confetti isActive={showConfetti} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'flex flex-col min-h-screen lg:min-h-full lg:h-full text-white',
          className
        )}
      >
        {/* Header - Mobile Only */}
        <header className="flex items-center justify-between px-4 py-4 lg:hidden">
          <button
            onClick={onHomeClick}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="홈으로"
          >
            <Home className="w-5 h-5" />
          </button>

          <PhaseIndicator currentPhase="complete" />

          <button
            onClick={onCloseClick}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Theme Badge - Mobile Only */}
        <div className="px-4 mt-2 lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-300 via-green-200 to-lime-100" />
            <div>
              <p className="text-xs text-white/50">촬영 중인 테마</p>
              <p className="font-medium">{themeName}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative">
          <SparkleEffects />
          
          {/* Complete Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15,
              delay: 0.3 
            }}
            className="relative mb-8"
          >
            {/* Glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.glow} 0%, transparent 60%)`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0.1, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
            />
            
            {/* Icon container */}
            <div
              className="relative flex items-center justify-center w-28 h-28 rounded-full"
              style={{
                backgroundColor: colors.bg,
                boxShadow: `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}`,
              }}
            >
              <CheckCircle
                className="w-14 h-14"
                style={{ color: colors.stroke }}
                strokeWidth={1.5}
              />
            </div>
          </motion.div>

          {/* Phase Info */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold text-center mb-2"
          >
            {phaseConfig.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-white/60 text-center mb-8"
          >
            {subtitle}
          </motion.p>

          {/* Thumbnail Preview */}
          {thumbnailImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-4 gap-2 mb-8 max-w-xs"
            >
              {thumbnailImages.map((image, index) => (
                <motion.div
                  key={image.url}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white/10"
                >
                  <Image
                    src={image.thumbnail_url || image.url}
                    alt={`화보 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="px-4 pb-8">
          {/* CTA Button with shimmer */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            onClick={onViewResults}
            className={cn(
              'relative w-full py-4 rounded-2xl font-semibold text-lg',
              'bg-gradient-to-r from-amber-400 to-amber-500',
              'text-slate-900 shadow-lg shadow-amber-500/30',
              'overflow-hidden',
              'hover:shadow-amber-500/50 transition-shadow'
            )}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 -translate-x-full animate-shimmer"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
            />
            
            <span className="relative flex items-center justify-center gap-2">
              화보 보러 가기
              <ChevronRight className="w-5 h-5" />
            </span>
          </motion.button>

          {/* Share button */}
          {onShare && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={onShare}
              className="flex items-center justify-center gap-2 w-full py-4 mt-4 text-white/60 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>친구에게 공유하기</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </>
  );
}
