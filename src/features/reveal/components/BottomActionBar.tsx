'use client';

import { Download, Share2, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomActionBarProps {
  selectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onDownloadSelected: () => void;
  onDownloadAll: () => void;
  onShare: () => void;
  isDownloading?: boolean;
  className?: string;
}

export function BottomActionBar({
  selectionMode,
  selectedCount,
  totalCount,
  onToggleSelectionMode,
  onSelectAll,
  onDownloadSelected,
  onDownloadAll,
  onShare,
  isDownloading = false,
  className,
}: BottomActionBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-slate-900/95 backdrop-blur-xl',
        'border-t border-white/10',
        'px-4 pt-4 pb-8',
        className
      )}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* 왼쪽: 선택 모드 토글 */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSelectionMode}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'text-sm font-medium',
                'transition-colors',
                selectionMode
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              {selectionMode ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectionMode ? '선택 중' : '사진 선택'}
            </button>

            {selectionMode && (
              <button
                onClick={onSelectAll}
                className={cn(
                  'px-3 py-2 rounded-lg',
                  'text-sm font-medium',
                  'bg-white/10 text-white hover:bg-white/20',
                  'transition-colors'
                )}
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
            )}

            {selectionMode && selectedCount > 0 && (
              <span className="text-white/60 text-sm">
                {selectedCount}장 선택
              </span>
            )}
          </div>

          {/* 오른쪽: 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {/* 저장 버튼 */}
            <button
              onClick={selectionMode && selectedCount > 0 ? onDownloadSelected : onDownloadAll}
              disabled={isDownloading}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg',
                'text-sm font-medium',
                'transition-colors',
                isDownloading
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-900 hover:bg-white/90'
              )}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">
                {selectionMode && selectedCount > 0
                  ? `선택 저장 (${selectedCount})`
                  : `전체 저장`}
              </span>
              <span className="sm:hidden">저장</span>
            </button>

            {/* 공유 버튼 */}
            <button
              onClick={onShare}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg',
                'text-sm font-medium',
                'bg-white/10 text-white hover:bg-white/20',
                'transition-colors'
              )}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">공유</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
