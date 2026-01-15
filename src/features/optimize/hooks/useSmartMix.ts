'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUploadStore } from '@/features/upload/store/upload-store';
import type { QueuedFile } from '@/features/upload/types';
import type { CropMode } from '../types';
import { assignSmartMixModes, shouldApplySmartMix } from '../lib/smart-mix';

interface OptimizedImage extends QueuedFile {
  cropMode: CropMode;
}

interface UseSmartMixOptions {
  autoAssign?: boolean;
}

export function useSmartMix(options: UseSmartMixOptions = { autoAssign: true }) {
  const { groomQueue, brideQueue } = useUploadStore();

  // 모든 완료된 이미지 가져오기
  const allImages = [...groomQueue, ...brideQueue].filter(
    (img) => img.status === 'completed' && img.previewUrl
  );

  // 크롭 모드 상태 관리
  const [cropModes, setCropModes] = useState<Map<string, CropMode>>(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Smart Mix 자동 할당
  useEffect(() => {
    if (!options.autoAssign || allImages.length === 0) return;

    // 이미 할당된 이미지는 건너뜀
    const unassignedImages = allImages.filter((img) => !cropModes.has(img.id));
    if (unassignedImages.length === 0) return;

    // Smart Mix 적용 여부 판단
    if (shouldApplySmartMix(allImages)) {
      setIsScanning(true);
      setScanProgress(0);

      // 스캔 애니메이션 (실제 분석 시뮬레이션)
      const totalDuration = 2000; // 2초
      const interval = 50;
      let elapsed = 0;

      const timer = setInterval(() => {
        elapsed += interval;
        const progress = Math.min((elapsed / totalDuration) * 100, 100);
        setScanProgress(progress);

        if (elapsed >= totalDuration) {
          clearInterval(timer);

          // 새로운 이미지에 대해서만 모드 할당
          const modes = assignSmartMixModes(unassignedImages.length);
          const newCropModes = new Map(cropModes);

          unassignedImages.forEach((img, index) => {
            newCropModes.set(img.id, modes[index]);
          });

          setCropModes(newCropModes);
          setIsScanning(false);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [allImages.length, options.autoAssign]);

  // 개별 이미지 크롭 모드 토글
  const toggleCropMode = useCallback((imageId: string, currentMode: CropMode) => {
    setCropModes((prev) => {
      const newModes = new Map(prev);
      // original -> face -> body -> original 순환
      const nextMode: CropMode =
        currentMode === 'original' ? 'face' :
        currentMode === 'face' ? 'body' : 'original';
      newModes.set(imageId, nextMode);
      return newModes;
    });
  }, []);

  // 전체 이미지에 크롭 모드 적용된 결과
  const optimizedImages: OptimizedImage[] = allImages.map((img) => ({
    ...img,
    cropMode: cropModes.get(img.id) || 'original',
  }));

  // 통계
  const stats = {
    total: optimizedImages.length,
    faceMode: optimizedImages.filter((img) => img.cropMode === 'face').length,
    bodyMode: optimizedImages.filter((img) => img.cropMode === 'body').length,
    original: optimizedImages.filter((img) => img.cropMode === 'original').length,
  };

  return {
    images: optimizedImages,
    isScanning,
    scanProgress,
    toggleCropMode,
    stats,
  };
}
