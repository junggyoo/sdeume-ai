'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { useGenerationById } from '@/features/generation/hooks';
import { ResultGallery, ImageLightbox } from '@/features/reveal/components';
import { downloadImage, downloadAllImages, generateFilename } from '@/features/reveal/utils/download';
import type { GenerationImage } from '@/features/generation/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function GalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const generationId = params.id as string;

  const { generation, isLoading, error } = useGenerationById(generationId);

  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<GenerationImage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const handleImageClick = useCallback((image: GenerationImage, index: number) => {
    setLightboxImage(image);
    setLightboxIndex(index);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxImage(null);
  }, []);

  const handleDownloadSingle = useCallback(
    async (image: GenerationImage, index?: number) => {
      const idx = index ?? generation?.images?.findIndex((img) => img.url === image.url) ?? 0;
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

  const handleLightboxDownload = useCallback(() => {
    if (lightboxImage) {
      handleDownloadSingle(lightboxImage, lightboxIndex);
    }
  }, [lightboxImage, lightboxIndex, handleDownloadSingle]);

  const handleBack = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="aspect-[4/5] w-full rounded-card mb-6" />
          <div className="columns-2 gap-4 md:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full rounded-image mb-4" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !generation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">화보를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          대시보드로 돌아가기
        </Button>
      </div>
    );
  }

  // Empty images state
  if (!generation.images || generation.images.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">생성된 이미지가 없습니다.</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          대시보드로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header with back button */}
        <header className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            마이 스튜디오
          </Button>
        </header>

        {/* Gallery */}
        <ResultGallery
          images={generation.images}
          onImageClick={handleImageClick}
          onDownload={handleDownloadSingle}
          onDownloadAll={handleDownloadAll}
        />

        {/* Lightbox */}
        <ImageLightbox
          image={lightboxImage}
          isOpen={!!lightboxImage}
          onClose={handleCloseLightbox}
          onDownload={handleLightboxDownload}
        />
      </div>
    </div>
  );
}
