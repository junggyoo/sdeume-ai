import type { CropRect } from '@/features/upload/types';

export type CropMode = 'original' | 'face' | 'body';

export interface OptimizedImage {
  id: string;
  uploadId: string;
  previewUrl: string;
  cropMode: CropMode;
  cropRect: CropRect | null;
  bucket: 'A' | 'B' | 'C';
  role: 'groom' | 'bride';
}

export interface SmartMixConfig {
  faceRatio: number; // 60% by default
  bodyRatio: number; // 40% by default
  faceCropMultiplier: number; // How much to expand face crop
  bodyCropMultiplier: number; // How much to expand body crop
}

export const DEFAULT_SMART_MIX_CONFIG: SmartMixConfig = {
  faceRatio: 0.6,
  bodyRatio: 0.4,
  faceCropMultiplier: 1.5, // Face size * 1.5
  bodyCropMultiplier: 2.5, // Face size * 2.5 for body
};
