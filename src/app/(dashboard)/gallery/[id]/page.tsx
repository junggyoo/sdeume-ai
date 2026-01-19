'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { useGenerationById } from '@/features/generation/hooks';
import { ResultGallery, ImageLightbox } from '@/features/reveal/components';
import {
  downloadImage,
  downloadAllImages,
  generateFilename,
} from '@/features/reveal/utils/download';
import type { GenerationImage } from '@/features/generation/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function GalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const generationId = params.id as string;

  const { generation, isLoading, error } = useGenerationById(generationId);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleImageClick = useCallback(
    (_image: GenerationImage, index: number) => {
      setLightboxIndex(index);
    },
    []
  );

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handleLightboxNavigate = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const handleDownloadSingle = useCallback(
    async (image: GenerationImage, index?: number) => {
      const idx =
        index ??
        generation?.images?.findIndex((img) => img.url === image.url) ??
        0;
      const filename = generateFilename(idx, generationId);
      await downloadImage(image.url, filename);
    },
    [generation?.images, generationId]
  );

  const handleDownloadAll = useCallback(async () => {
    if (generation?.images) {
      await downloadAllImages(generation.images, generationId);
    }
  }, [generation?.images, generationId]);

  const handleLightboxDownload = useCallback(
    async (index: number) => {
      if (generation?.images?.[index]) {
        const filename = generateFilename(index, generationId);
        await downloadImage(generation.images[index].url, filename);
      }
    },
    [generation?.images, generationId]
  );

  const handleBack = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8 bg-slate-700" />
          <Skeleton className="aspect-[4/5] w-full rounded-card mb-6 bg-slate-700" />
          <div className="columns-2 gap-4 md:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-[4/5] w-full rounded-image mb-4 bg-slate-700"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !generation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-slate-400 mb-4">화보를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={handleBack} className="border-slate-600 text-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" />
          대시보드로 돌아가기
        </Button>
      </div>
    );
  }

  if (!generation.images || generation.images.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-slate-400 mb-4">생성된 이미지가 없습니다.</p>
        <Button variant="outline" onClick={handleBack} className="border-slate-600 text-slate-200">
          <ArrowLeft className="w-4 h-4 mr-2" />
          대시보드로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            마이 스튜디오
          </Button>
        </header>

        <ResultGallery
          images={generation.images}
          onImageClick={handleImageClick}
          onDownload={handleDownloadSingle}
          onDownloadAll={handleDownloadAll}
        />

        <ImageLightbox
          images={generation.images}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={handleCloseLightbox}
          onDownload={handleLightboxDownload}
          onNavigate={handleLightboxNavigate}
        />
      </div>
    </div>
  );
}
