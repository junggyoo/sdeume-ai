'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PHASES, type WaitingPhase } from '../../constants';
import { GlowingProgressRing } from './GlowingProgressRing';
import { PhaseIndicator } from './PhaseIndicator';
import { RollingText } from './RollingText';
import { PhantomThumbs } from './PhantomThumbs';
import { NotificationCard } from './NotificationCard';

interface WaitingContentProps {
  phase: WaitingPhase;
  progress: number;
  themeName?: string;
  onHomeClick?: () => void;
  className?: string;
}

export function WaitingContent({
  phase,
  progress,
  themeName = '스튜디오',
  onHomeClick,
  className,
}: WaitingContentProps) {
  const phaseConfig = PHASES[phase];

  const subtitle = useMemo(() => {
    return phaseConfig.subtitle.replace('{themeName}', themeName);
  }, [phaseConfig.subtitle, themeName]);

  return (
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

        <PhaseIndicator currentPhase={phase} />

        {/* Spacer for layout balance */}
        <div className="w-12 h-12" />
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Progress Ring with Phantom Thumbs */}
        <div className="relative mb-8">
          <PhantomThumbs phase={phase} />
          <GlowingProgressRing
            progress={progress}
            phase={phase}
            size={220}
          />
        </div>

        {/* Phase Info */}
        <motion.h2
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-center mb-2"
        >
          {phaseConfig.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/60 text-center mb-4"
        >
          {subtitle}
        </motion.p>

        {/* Duration Badge */}
        {phaseConfig.duration && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 mb-6">
            <Clock className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/80">{phaseConfig.duration}</span>
          </div>
        )}

        {/* Rolling Text */}
        <RollingText messages={phaseConfig.messages} className="mb-8" />
      </div>

      {/* Bottom Section */}
      <div className="px-4 pb-8">
        <NotificationCard className="mb-4" />
        
        <p className="text-center text-sm text-white/40">
          화면을 벗어나도 진행됩니다.
          <br />
          완료되면 알림으로 알려드릴게요!
        </p>
      </div>
    </motion.div>
  );
}
