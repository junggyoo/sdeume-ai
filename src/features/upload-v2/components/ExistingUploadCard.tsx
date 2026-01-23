'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import { cn } from '@/lib/utils';
import type { Upload } from '@/features/upload/types';

interface ExistingUploadCardProps {
  upload: Upload;
  index?: number;
}

/**
 * Read-only card for displaying existing uploads from the server.
 * Used in Edit Mode when user navigates back from Step2 to Step1.
 * No delete button - existing uploads cannot be removed from Step1.
 */
export function ExistingUploadCard({
  upload,
  index = 0,
}: ExistingUploadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: index * 0.05,
      }}
      className={cn(
        'relative aspect-square rounded-2xl overflow-hidden',
        'bg-white shadow-sm border border-gray-100'
      )}
    >
      {/* Image */}
      <Image
        src={upload.originalUrl}
        alt="Uploaded photo"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 25vw"
      />

      {/* Uploaded badge (always visible) */}
      <div
        className={cn(
          'absolute bottom-2 left-2 px-2 py-1 backdrop-blur-md rounded-lg',
          'text-[10px] font-bold uppercase flex items-center gap-1',
          'bg-white/90 text-green-600'
        )}
      >
        <CheckCircle2 size={10} />
        업로드됨
      </div>
    </motion.div>
  );
}
