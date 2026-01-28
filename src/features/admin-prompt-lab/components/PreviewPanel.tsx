'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PromptTestImage, AssembledPrompts } from '../types';

// =============================================================================
// Icons (inline to avoid lucide import issues)
// =============================================================================

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const LoaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// =============================================================================
// Types
// =============================================================================

interface PreviewPanelProps {
  images: PromptTestImage[] | null;
  isLoading: boolean;
  seed: number | null;
  generationTimeMs: number | null;
  themeSlug: string | null;
  onDownload?: () => void;
  onSave?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const PreviewPanel = ({
  images,
  isLoading,
  seed,
  generationTimeMs,
  themeSlug,
  onDownload,
  onSave,
  onToggleFavorite,
  isFavorite = false,
  className,
}: PreviewPanelProps) => {
  const handleDownload = (image: PromptTestImage) => {
    const link = document.createElement('a');
    link.href = `data:${image.contentType};base64,${image.base64}`;
    link.download = `test-${seed || 'image'}.png`;
    link.click();
  };

  return (
    <Card className={cn('sticky top-4', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Result Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-2">
          {isLoading ? (
            <>
              <Skeleton className="aspect-[3/4] rounded-lg" />
              <Skeleton className="aspect-[3/4] rounded-lg" />
            </>
          ) : images && images.length > 0 ? (
            images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted cursor-pointer group"
                onClick={() => handleDownload(image)}
              >
                <img
                  src={`data:${image.contentType};base64,${image.base64}`}
                  alt={`Generated ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <DownloadIcon />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 aspect-[3/4] rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
              {isLoading ? (
                <LoaderIcon />
              ) : (
                'No images yet'
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {images && images.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => images.forEach(handleDownload)}
              className="flex-1"
            >
              <DownloadIcon />
              <span className="ml-2">Download</span>
            </Button>
            {onToggleFavorite && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFavorite}
              >
                <StarIcon filled={isFavorite} />
              </Button>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {seed !== null && (
            <div className="flex justify-between">
              <span>Seed:</span>
              <span className="font-mono">{seed}</span>
            </div>
          )}
          {generationTimeMs !== null && (
            <div className="flex justify-between">
              <span>Time:</span>
              <span className="font-mono">{(generationTimeMs / 1000).toFixed(1)}s</span>
            </div>
          )}
          {themeSlug && (
            <div className="flex justify-between">
              <span>Theme:</span>
              <span className="font-mono">{themeSlug}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
