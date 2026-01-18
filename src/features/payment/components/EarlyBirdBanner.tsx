'use client';

import { Gift } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';

export function EarlyBirdBanner() {
  const { days, hours, minutes, seconds } = useCountdown('2026-01-31T23:59:59');

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-xl border border-violet-500/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <p className="font-bold text-white">얼리버드 특가 진행 중!</p>
          <p className="text-sm text-slate-400">
            1월 31일까지 모든 패키지 최대 33% 할인
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-400">남은 시간</p>
        <p className="font-mono font-bold text-white">
          {days}일 {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
      </div>
    </div>
  );
}
