'use client';

import type { CropRect } from '@/features/upload/types';
import type { CropMode, SmartMixConfig, DEFAULT_SMART_MIX_CONFIG } from '../types';

interface FaceLandmarks {
  faceBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Smart Mix: 하이브리드 크로핑 로직
 * - 동일 의상/배경에서 50%+ 발생 시 자동 적용
 * - Face Focus (60%): 목/쇄골 위 타이트 크롭
 * - Structure Focus (40%): 어깨선 포함 루즈 크롭
 */

export function calculateFaceCrop(
  faceBox: FaceLandmarks['faceBox'],
  imageWidth: number,
  imageHeight: number,
  multiplier: number = 1.5
): CropRect {
  const { x, y, width, height } = faceBox;

  // 얼굴 중심점
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // 크롭 영역 크기 (얼굴 크기 * multiplier)
  const cropSize = Math.max(width, height) * multiplier;

  // 정사각형 크롭 영역 계산
  let cropX = centerX - cropSize / 2;
  let cropY = centerY - cropSize / 2;

  // 이미지 경계 내로 제한
  cropX = Math.max(0, Math.min(cropX, imageWidth - cropSize));
  cropY = Math.max(0, Math.min(cropY, imageHeight - cropSize));

  // 최종 크기 조정 (이미지 경계 초과 시)
  const finalWidth = Math.min(cropSize, imageWidth - cropX);
  const finalHeight = Math.min(cropSize, imageHeight - cropY);

  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
  };
}

export function calculateBodyCrop(
  faceBox: FaceLandmarks['faceBox'],
  imageWidth: number,
  imageHeight: number,
  multiplier: number = 2.5
): CropRect {
  const { x, y, width, height } = faceBox;

  // 얼굴 중심점
  const centerX = x + width / 2;

  // 상반신 크롭 - 얼굴 위쪽부터 시작하여 아래로 확장
  const cropHeight = height * multiplier;
  const cropWidth = cropHeight; // 정사각형

  // 크롭 시작 위치 (얼굴 위쪽에 약간의 여백)
  const headRoom = height * 0.3;
  let cropX = centerX - cropWidth / 2;
  let cropY = y - headRoom;

  // 이미지 경계 내로 제한
  cropX = Math.max(0, Math.min(cropX, imageWidth - cropWidth));
  cropY = Math.max(0, cropY);

  // 최종 크기 조정
  const finalWidth = Math.min(cropWidth, imageWidth - cropX);
  const finalHeight = Math.min(cropHeight, imageHeight - cropY);

  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
  };
}

export function getSmartMixCrop(
  mode: CropMode,
  faceBox: FaceLandmarks['faceBox'] | null,
  imageWidth: number,
  imageHeight: number,
  config: SmartMixConfig = {
    faceRatio: 0.6,
    bodyRatio: 0.4,
    faceCropMultiplier: 1.5,
    bodyCropMultiplier: 2.5,
  }
): CropRect | null {
  if (mode === 'original' || !faceBox) {
    return null; // 원본 사용
  }

  if (mode === 'face') {
    return calculateFaceCrop(faceBox, imageWidth, imageHeight, config.faceCropMultiplier);
  }

  if (mode === 'body') {
    return calculateBodyCrop(faceBox, imageWidth, imageHeight, config.bodyCropMultiplier);
  }

  return null;
}

/**
 * Smart Mix 자동 적용 여부 판단
 * - 동일 배경/의상 50% 이상 시 활성화
 * - 현재는 단순히 true 반환 (추후 이미지 분석 로직 추가)
 */
export function shouldApplySmartMix(
  _images: { previewUrl?: string }[]
): boolean {
  // TODO: 이미지 유사도 분석 로직 구현
  // 현재는 항상 Smart Mix 적용
  return true;
}

/**
 * 이미지 배열에 대한 Smart Mix 자동 할당
 * - 60%는 face 모드
 * - 40%는 body 모드
 */
export function assignSmartMixModes(
  imageCount: number,
  config: SmartMixConfig = {
    faceRatio: 0.6,
    bodyRatio: 0.4,
    faceCropMultiplier: 1.5,
    bodyCropMultiplier: 2.5,
  }
): CropMode[] {
  const faceCount = Math.round(imageCount * config.faceRatio);
  const modes: CropMode[] = [];

  for (let i = 0; i < imageCount; i++) {
    modes.push(i < faceCount ? 'face' : 'body');
  }

  // 셔플하여 자연스러운 분포
  return shuffleArray(modes);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
