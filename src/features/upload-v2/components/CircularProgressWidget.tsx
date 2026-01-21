'use client';

import { motion } from 'framer-motion';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import {
  MIN_PHOTOS_PER_ROLE,
  RECOMMENDED_PHOTOS_PER_ROLE,
} from '@/features/upload/types';
import { MagneticButton } from './MagneticButton';

interface CircularProgressWidgetProps {
  groomCount: number;
  brideCount: number;
  onNext: () => void;
  isLoading?: boolean;
  isSyncing?: boolean;
}

export function CircularProgressWidget({
  groomCount,
  brideCount,
  onNext,
  isLoading = false,
  isSyncing = false,
}: CircularProgressWidgetProps) {
  const total = groomCount + brideCount;
  const maxPhotos = RECOMMENDED_PHOTOS_PER_ROLE * 2;
  const minRequired = MIN_PHOTOS_PER_ROLE * 2;

  const groomHasMinimum = groomCount >= MIN_PHOTOS_PER_ROLE;
  const brideHasMinimum = brideCount >= MIN_PHOTOS_PER_ROLE;
  const isReady = groomHasMinimum && brideHasMinimum && !isLoading && !isSyncing;

  const progress = Math.min(total / maxPhotos, 1);
  const remainingNeeded = Math.max(minRequired - total, 0);

  // SVG circle calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[32px] p-8 shadow-xl flex flex-col items-center"
    >
      <h3 className="text-xl font-serif font-bold mb-6 w-full text-left text-gray-900">
        진행 상황
      </h3>

      <div className="relative w-40 h-40 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#progress-gradient)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient
              id="progress-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-4xl font-serif font-bold ${isReady ? 'text-green-600' : 'text-gray-900'}`}
          >
            {total}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            / {maxPhotos} 장
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mb-8 px-4 h-10 flex items-center justify-center">
        {isSyncing ? (
          <span>업로드 중...</span>
        ) : isLoading ? (
          <span>처리 중...</span>
        ) : !isReady ? (
          <span>
            <span className="text-red-500 font-bold">{remainingNeeded}장</span>{' '}
            더 필요합니다.
          </span>
        ) : (
          <span className="text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 size={16} /> 준비 완료! 다음 단계로 진행하세요.
          </span>
        )}
      </p>

      <MagneticButton onClick={onNext} disabled={!isReady}>
        {isReady ? '다음 단계로' : `${remainingNeeded}장 더 필요`}
      </MagneticButton>
    </motion.div>
  );
}
