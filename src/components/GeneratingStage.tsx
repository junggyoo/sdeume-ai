'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScanFace from 'lucide-react/dist/esm/icons/scan-face';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { PHASES } from '@/features/shooting/constants';
import { MagneticButton } from '@/features/dashboard-v2/interactions/MagneticButton';

export type GeneratingPhase = 'training' | 'generating' | 'complete';

interface GeneratingStageProps {
  themeImage: string;
  onFinish: () => void;
  // Controlled mode props (optional)
  controlledPhase?: GeneratingPhase;
  controlledProgress?: number;
  completedPhotos?: number;
  totalPhotos?: number;
}

export default function GeneratingStage({
  themeImage,
  onFinish,
  controlledPhase,
  controlledProgress,
  completedPhotos,
  totalPhotos = 12,
}: GeneratingStageProps) {
  const isControlled = controlledPhase !== undefined;

  // Phase State: 'training' -> 'generating' -> 'complete'
  const [internalPhase, setInternalPhase] = useState<GeneratingPhase>('training');
  const phase = isControlled ? controlledPhase : internalPhase;

  // Phase 1 State
  const [trainingProgress, setTrainingProgress] = useState(0);

  // Phase 2 State
  const TOTAL_PHOTOS = totalPhotos;
  const [internalCompletedCount, setInternalCompletedCount] = useState(0);
  const [genProgress, setGenProgress] = useState(0);

  // Controlled mode: use external completedPhotos
  const completedCount = isControlled ? (completedPhotos ?? 0) : internalCompletedCount;

  // Tips State - use PHASES messages from constants
  const learningMessages = PHASES.learning.messages;
  const generatingMessages = PHASES.generating.messages;
  const currentMessages = phase === 'generating' ? generatingMessages : learningMessages;

  const [tipIndex, setTipIndex] = useState(0);
  const [notify, setNotify] = useState(false);

  // --- LOGIC: Rotating Tips ---
  useEffect(() => {
    const interval = setInterval(
      () => setTipIndex((i) => (i + 1) % currentMessages.length),
      4000
    );
    return () => clearInterval(interval);
  }, [currentMessages.length]);

  // --- LOGIC: Phase 1 (Training) ---
  useEffect(() => {
    if (phase !== 'training') return;

    // Simulate Training (Slower)
    const interval = setInterval(() => {
      setTrainingProgress((p) => {
        if (p >= 100) {
          if (!isControlled) {
            setInternalPhase('generating');
          }
          return 100;
        }
        return p + 0.5; // Slow increment
      });
    }, 30);
    return () => clearInterval(interval);
  }, [phase, isControlled]);

  // --- LOGIC: Phase 2 (Generation) ---
  useEffect(() => {
    if (phase !== 'generating') return;
    if (!isControlled && internalCompletedCount >= TOTAL_PHOTOS) {
      setInternalPhase('complete');
      return;
    }

    // Simulate Generation (Per Photo)
    const interval = setInterval(() => {
      setGenProgress((p) => {
        if (p >= 100) {
          if (!isControlled) {
            setInternalCompletedCount((c) => c + 1);
          }
          return 0;
        }
        return p + 2; // Faster increment
      });
    }, 20);
    return () => clearInterval(interval);
  }, [phase, isControlled, internalCompletedCount, TOTAL_PHOTOS]);

  // Reset genProgress when completedPhotos changes in controlled mode
  useEffect(() => {
    if (phase === 'generating' && isControlled) {
      setGenProgress(0);
    }
  }, [phase, isControlled, completedPhotos]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-between py-8 relative overflow-hidden bg-[#FAFAFA]">
      {/* 1. Header Text */}
      <div className="text-center z-10 mt-6 space-y-3 px-4">
        <motion.div
          layout
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-widest"
        >
          {phase === 'training' && (
            <>
              <ScanFace size={12} className="animate-pulse" /> 얼굴 분석 중
            </>
          )}
          {phase === 'generating' && (
            <>
              <Loader2 size={12} className="animate-spin" /> 화보 현상 중 {completedCount + 1}
            </>
          )}
          {phase === 'complete' && (
            <>
              <CheckCircle2 size={12} /> 촬영 완료
            </>
          )}
        </motion.div>

        <h2 className="text-4xl md:text-5xl font-serif text-gray-900 leading-tight">
          {phase === 'training'
            ? '얼굴을 학습하고 있어요...'
            : phase === 'generating'
              ? `${completedCount + 1}번째 화보를 현상하고 있어요...`
              : '컬렉션 완성!'}
        </h2>

        {/* Animated Subtitle */}
        <div className="h-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase === 'complete' ? 'complete' : tipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-gray-400 text-sm font-medium"
            >
              {phase === 'complete'
                ? `${TOTAL_PHOTOS}장의 아름다운 화보가 완성되었어요`
                : currentMessages[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Main Stage (Center Visual) */}
      <div className="flex-1 flex items-center justify-center w-full relative my-8">
        <AnimatePresence mode="wait">
          {/* A. Training Card (Scanning) */}
          {phase === 'training' && (
            <motion.div
              key="training"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              className="relative w-64 aspect-[3/4] md:w-80 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white z-20 bg-black"
            >
              <img src={themeImage} alt="Theme" className="w-full h-full object-cover opacity-60 grayscale" />
              {/* Scanning Line */}
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-purple-500 shadow-[0_0_25px_rgba(168,85,247,1)] z-30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-serif font-bold text-white drop-shadow-lg">
                  {Math.floor(trainingProgress)}%
                </span>
              </div>
            </motion.div>
          )}

          {/* B. Generation Card (Blur De-noising) */}
          {phase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative w-64 aspect-[3/4] md:w-80 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white z-20 bg-gray-900"
            >
              <img
                src={themeImage}
                alt="Generating"
                className="w-full h-full object-cover transition-all duration-300"
                style={{ filter: `blur(${20 - genProgress / 5}px)` }}
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-6xl font-serif font-bold text-white/90 drop-shadow-md">
                  {Math.floor(genProgress)}%
                </span>
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest mt-2 bg-black/30 px-3 py-1 rounded-full">
                  약 10분 소요
                </span>
              </div>
            </motion.div>
          )}

          {/* C. Reveal Button */}
          {phase === 'complete' && (
            <MagneticButton
              onClick={onFinish}
              className="px-12 py-5 bg-black text-white rounded-full font-bold text-lg shadow-2xl flex items-center gap-3 z-30"
            >
              <CheckCircle2 size={20} /> 앨범 열기 ({TOTAL_PHOTOS}장) <Sparkles size={16} />
            </MagneticButton>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Bottom Section: Notification & Film Strip */}
      <div className="w-full px-6 z-10 flex flex-col items-center min-h-[160px] justify-end">
        {/* Phase 1: Notify Toggle */}
        {phase === 'training' && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 cursor-pointer w-full max-w-sm"
            onClick={() => setNotify(!notify)}
          >
            <div className={`p-2 rounded-full ${notify ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
              <Bell size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">완료 시 알림 받기</p>
              <p className="text-xs text-gray-500">푸시 알림을 보내드릴게요.</p>
            </div>
            <div className={`w-11 h-6 rounded-full p-1 transition-colors ${notify ? 'bg-purple-600' : 'bg-gray-300'}`}>
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${notify ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </div>
          </motion.div>
        )}

        {/* Phase 2: Dynamic Film Strip (Grows from center) */}
        {(phase === 'generating' || phase === 'complete') && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex justify-center">
              <motion.div
                layout
                layoutScroll
                className="relative h-32 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3 px-4 overflow-x-auto overflow-y-hidden shadow-2xl"
                style={{
                  width: completedCount === 0 ? '0px' : 'auto',
                  maxWidth: '100%',
                  scrollbarWidth: 'none',
                  opacity: completedCount === 0 ? 0 : 1,
                }}
              >
                <AnimatePresence mode="popLayout">
                  {Array.from({ length: completedCount }).map((_, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: -40, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                      className="relative flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border border-white/20 shadow-lg bg-gray-900"
                    >
                      <img src={themeImage} alt={`Photo ${i + 1}`} className="w-full h-full object-cover opacity-60 blur-[1px]" />
                      <div className="absolute bottom-1 right-1 text-[9px] font-bold text-white/50">#{i + 1}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
            {/* Reel Counter */}
            {completedCount > 0 && (
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">
                현상된 필름 • {completedCount} / {TOTAL_PHOTOS}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
