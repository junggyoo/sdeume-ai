'use client';

import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { cn } from '@/lib/utils';
import type { QueuedFile, Upload } from '@/features/upload/types';
import { AtelierPhotoCard } from './AtelierPhotoCard';
import { ExistingUploadCard } from './ExistingUploadCard';

interface AtelierPhotoGridProps {
  items: QueuedFile[];
  existingUploads?: Upload[];
  onRemove: (id: string) => void;
  onAddMore: (files: File[]) => void;
  onRotate?: (id: string, degrees: 90 | -90) => void;
  maxPhotos?: number;
}

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.webp,.heic,.heif';

export function AtelierPhotoGrid({
  items,
  existingUploads = [],
  onRemove,
  onAddMore,
  onRotate,
  maxPhotos = 20,
}: AtelierPhotoGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onAddMore(files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onAddMore]
  );

  // Combined count of existing uploads + new uploads in queue
  const totalCount = existingUploads.length + items.length;
  const canAddMore = totalCount < maxPhotos;

  // Don't render if there are no items to display
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif font-bold text-gray-900">
          업로드된 사진
        </h3>
        <span className="text-sm text-gray-500">
          {totalCount}/{maxPhotos}장
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {/* Add more button as first slot */}
        {canAddMore && (
          <motion.button
            onClick={handleAddClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'aspect-square rounded-2xl',
              'border-2 border-dashed border-gray-300',
              'bg-white/60 hover:bg-purple-50 hover:border-purple-400',
              'flex flex-col items-center justify-center gap-2',
              'transition-colors cursor-pointer group'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
              <Plus
                className="text-gray-400 group-hover:text-purple-500 transition-colors"
                size={20}
              />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-purple-500 transition-colors">
              추가
            </span>
          </motion.button>
        )}

        {/* Existing uploads (read-only) */}
        {existingUploads.map((upload, index) => (
          <ExistingUploadCard
            key={upload.id}
            upload={upload}
            index={index}
          />
        ))}

        {/* New photo cards (from local queue) */}
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <AtelierPhotoCard
              key={item.id}
              item={item}
              onRemove={onRemove}
              onRotate={onRotate}
              index={existingUploads.length + index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
