'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  progress: number;
  total: number;
  variant?: 'light' | 'dark';
}

export function UploadProgress({
  progress,
  total,
  variant = 'light',
}: UploadProgressProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const isDark = variant === 'dark';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        className={cn(
          'rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl',
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'
        )}
      >
        <div className="flex flex-col items-center">
          <Loader2
            className={cn(
              'w-12 h-12 animate-spin mb-4',
              isDark ? 'text-violet-400' : 'text-primary-desktop'
            )}
          />
          <h3
            className={cn(
              'text-lg font-semibold mb-2',
              isDark ? 'text-slate-100' : 'text-gray-900'
            )}
          >
            사진 업로드 중
          </h3>
          <p
            className={cn(
              'text-sm mb-4',
              isDark ? 'text-slate-400' : 'text-gray-500'
            )}
          >
            {progress} / {total} 완료
          </p>

          {/* Progress Bar */}
          <div
            className={cn(
              'w-full rounded-full h-2',
              isDark ? 'bg-slate-700' : 'bg-gray-200'
            )}
          >
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                isDark ? 'bg-violet-500' : 'bg-primary-desktop'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p
            className={cn(
              'text-xs mt-2',
              isDark ? 'text-slate-500' : 'text-gray-400'
            )}
          >
            잠시만 기다려주세요...
          </p>
        </div>
      </div>
    </div>
  );
}
