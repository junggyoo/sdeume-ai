'use client';

import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  total: number;
}

export function UploadProgress({ progress, total }: UploadProgressProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-primary-desktop animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            사진 업로드 중
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {progress} / {total} 완료
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-desktop h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            잠시만 기다려주세요...
          </p>
        </div>
      </div>
    </div>
  );
}
