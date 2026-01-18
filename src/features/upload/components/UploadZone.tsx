'use client';

import { memo, useCallback, useRef, useState } from 'react';
import ImagePlus from 'lucide-react/dist/esm/icons/image-plus';
import Camera from 'lucide-react/dist/esm/icons/camera';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { cn } from '@/lib/utils';
import type { UploadRole } from '../types';

export interface UploadZoneProps {
  onFilesSelect: (files: FileList) => void;
  photoCount: number;
  maxPhotos: number;
  role: UploadRole;
  isProcessing: boolean;
  processingCount: number;
  className?: string;
}

const ROLE_LABELS: Record<UploadRole, string> = {
  bride: '신부',
  groom: '신랑',
};

export const UploadZone = memo(function UploadZone({
  onFilesSelect,
  photoCount,
  maxPhotos,
  role,
  isProcessing,
  processingCount,
  className,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = Math.max(0, maxPhotos - photoCount);
  const isFull = remainingSlots === 0;

  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesSelect(files);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    },
    [onFilesSelect]
  );

  const handleGalleryClick = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFilesSelect(files);
      }
    },
    [onFilesSelect]
  );

  return (
    <div
      data-testid="upload-zone"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 p-6',
        'border-2 border-dashed rounded-2xl transition-all duration-200',
        'min-h-[180px]',
        isDragging
          ? 'border-violet-500 bg-violet-500/10'
          : 'border-slate-600 bg-slate-800/50',
        !isDragging && 'animate-pulse-border',
        className
      )}
    >
      {/* 히든 인풋 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
        disabled={isProcessing}
        className="hidden"
        data-testid="gallery-input"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFilesChange}
        disabled={isProcessing}
        className="hidden"
        data-testid="camera-input"
      />

      {/* 처리 중 오버레이 */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-2xl z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-sm text-slate-300">
              분석 중 <span className="font-bold text-violet-400">{processingCount}</span>
            </p>
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="text-center space-y-2">
        <p className="text-slate-300">
          <span className="font-medium text-violet-400">{ROLE_LABELS[role]}</span> 사진을 선택하거나
          드래그해주세요
        </p>
        <p className="text-xs text-slate-500">
          {isFull ? (
            <span className="text-emerald-400">충분히 올렸어요!</span>
          ) : (
            <span>{remainingSlots}장 더 추가 가능</span>
          )}
        </p>
      </div>

      {/* 버튼들 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGalleryClick}
          disabled={isProcessing}
          aria-label="갤러리에서 선택"
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
            'bg-violet-600 text-white hover:bg-violet-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ImagePlus className="w-5 h-5" />
          <span>갤러리</span>
        </button>

        <button
          type="button"
          onClick={handleCameraClick}
          disabled={isProcessing}
          aria-label="카메라로 촬영"
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
            'bg-slate-700 text-slate-200 hover:bg-slate-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Camera className="w-5 h-5" />
          <span>카메라</span>
        </button>
      </div>
    </div>
  );
});
