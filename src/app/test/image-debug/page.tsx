'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { processImage, convertHeicToJpeg } from '@/features/upload/lib/image-processor';
import imageCompression from 'browser-image-compression';

interface ImageInfo {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
}

interface DebugState {
  original: ImageInfo | null;
  processed: ImageInfo | null;
  exifOrientation: number | null;
  isProcessing: boolean;
  error: string | null;
  wasHeic: boolean;
}

const ORIENTATION_LABELS: Record<number, string> = {
  1: 'Normal',
  2: 'Flip horizontal',
  3: 'Rotate 180°',
  4: 'Flip vertical',
  5: 'Transpose (90° CW + flip horizontal)',
  6: 'Rotate 90° CW (iPhone portrait)',
  7: 'Transverse (90° CCW + flip horizontal)',
  8: 'Rotate 90° CCW',
  [-1]: 'Not found',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageDebugPage() {
  const [state, setState] = useState<DebugState>({
    original: null,
    processed: null,
    exifOrientation: null,
    isProcessing: false,
    error: null,
    wasHeic: false,
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Clean up previous URLs
      if (state.original?.previewUrl) {
        URL.revokeObjectURL(state.original.previewUrl);
      }
      if (state.processed?.previewUrl) {
        URL.revokeObjectURL(state.processed.previewUrl);
      }

      // Check if file is HEIC
      const isHeic = file.type.toLowerCase().includes('heic') ||
                     file.type.toLowerCase().includes('heif') ||
                     file.name.toLowerCase().endsWith('.heic') ||
                     file.name.toLowerCase().endsWith('.heif');

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        original: null,
        processed: null,
        exifOrientation: null,
        wasHeic: isHeic,
      }));

      try {
        // Read EXIF orientation from original file
        let orientation = -1;
        try {
          orientation = await imageCompression.getExifOrientation(file);
        } catch {
          console.warn('Failed to read EXIF orientation');
        }

        // For HEIC files, convert first to get dimensions (browsers can't load HEIC directly)
        let originalFile = file;
        if (isHeic) {
          originalFile = await convertHeicToJpeg(file);
        }

        // Get original image dimensions (from converted file if HEIC)
        const originalDimensions = await getImageDimensions(originalFile);
        const originalPreviewUrl = URL.createObjectURL(originalFile);

        // Process the image
        const processed = await processImage(file, {
          convertToWebP: false, // Keep original format for debugging
        });

        setState((prev) => ({
          original: {
            file: originalFile,
            previewUrl: originalPreviewUrl,
            width: originalDimensions.width,
            height: originalDimensions.height,
            size: file.size, // Keep original HEIC file size for comparison
          },
          processed: {
            file: processed.file,
            previewUrl: processed.previewUrl,
            width: processed.width,
            height: processed.height,
            size: processed.file.size,
          },
          exifOrientation: orientation,
          isProcessing: false,
          error: null,
          wasHeic: prev.wasHeic,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      }
    },
    [state.original?.previewUrl, state.processed?.previewUrl]
  );

  const handleDownload = useCallback(() => {
    if (!state.processed) return;

    const url = URL.createObjectURL(state.processed.file);
    const a = document.createElement('a');
    a.href = url;

    // Generate filename: original-name-normalized.ext
    const originalName = state.original?.file.name || 'image';
    const nameParts = originalName.split('.');
    const ext = nameParts.pop() || 'jpg';
    const baseName = nameParts.join('.');
    a.download = `${baseName}-normalized.${ext}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.processed, state.original?.file.name]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-16 text-slate-100">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Image EXIF Debug Tool
          </h1>
          <p className="text-sm text-slate-300">
            아이폰 등 모바일 기기에서 촬영한 세로 사진의 EXIF Orientation을
            확인하고, 회전 전처리(Baking) 결과를 검증합니다. 처리된 이미지를
            다운로드하여 Mac Preview 또는 sips 명령어로 확인할 수 있습니다.
          </p>
        </header>

        {/* File Input */}
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-lg">이미지 선택</CardTitle>
            <CardDescription>
              EXIF Orientation을 확인할 이미지를 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileSelect}
              className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-sm file:text-slate-100 hover:border-slate-600"
            />
          </CardContent>
        </Card>

        {/* Loading State */}
        {state.isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-slate-300" />
            <span className="ml-3 text-slate-300">처리 중...</span>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <Card className="border-rose-400/30 bg-rose-500/10">
            <CardContent className="pt-6">
              <p className="text-rose-300">오류: {state.error}</p>
            </CardContent>
          </Card>
        )}

        {/* HEIC Conversion Info */}
        {state.wasHeic && state.processed && (
          <Card className="border-violet-400/30 bg-violet-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-violet-600 px-3 py-1 text-sm font-medium text-white">
                  HEIC → JPEG
                </span>
                <span className="text-violet-200">
                  HEIC 파일이 JPEG로 자동 변환되었습니다
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* EXIF Orientation Info */}
        {state.exifOrientation !== null && (
          <Card className="border-slate-800 bg-slate-950/60">
            <CardHeader>
              <CardTitle className="text-lg">EXIF Orientation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-slate-700 px-4 py-2 font-mono text-2xl font-bold">
                  {state.exifOrientation}
                </span>
                <span className="text-slate-300">
                  {ORIENTATION_LABELS[state.exifOrientation] || 'Unknown'}
                </span>
                {state.exifOrientation === 6 && (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-300">
                    아이폰 세로 촬영
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Before/After Comparison */}
        {state.original && state.processed && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Before */}
            <Card className="border-slate-800 bg-slate-950/60">
              <CardHeader>
                <CardTitle className="text-lg">Before (원본)</CardTitle>
                <CardDescription>EXIF 메타데이터 포함 상태</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                  <img
                    src={state.original.previewUrl}
                    alt="Original"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">파일명</span>
                    <span className="font-mono text-slate-200">
                      {state.original.file.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">파일 크기</span>
                    <span className="font-mono text-slate-200">
                      {formatFileSize(state.original.size)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">해상도</span>
                    <span className="font-mono text-slate-200">
                      {state.original.width} x {state.original.height}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* After */}
            <Card className="border-slate-800 bg-slate-950/60">
              <CardHeader>
                <CardTitle className="text-lg">After (처리됨)</CardTitle>
                <CardDescription>
                  회전 Baking 및 압축 완료 상태
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                  <img
                    src={state.processed.previewUrl}
                    alt="Processed"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">파일명</span>
                    <span className="font-mono text-slate-200">
                      {state.processed.file.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">파일 크기</span>
                    <span className="font-mono text-slate-200">
                      {formatFileSize(state.processed.size)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">해상도</span>
                    <span className="font-mono text-slate-200">
                      {state.processed.width} x {state.processed.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">압축률</span>
                    <span className="font-mono text-emerald-400">
                      {(
                        (1 - state.processed.size / state.original.size) *
                        100
                      ).toFixed(1)}
                      % 감소
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Download Button */}
        {state.processed && (
          <Card className="border-slate-800 bg-slate-950/60">
            <CardContent className="pt-6">
              <Button
                onClick={handleDownload}
                className="w-full bg-emerald-600 py-6 text-lg font-semibold hover:bg-emerald-500"
              >
                처리된 이미지 다운로드
              </Button>
              <p className="mt-3 text-center text-xs text-slate-400">
                다운로드 후 Mac에서{' '}
                <code className="rounded bg-slate-800 px-1">
                  sips -g pixelHeight -g pixelWidth [파일명]
                </code>{' '}
                명령어로 회전이 정상 적용되었는지 확인하세요.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// Helper function to get image dimensions
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
