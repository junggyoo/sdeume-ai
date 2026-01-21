'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { cn } from '@/lib/utils';

interface AtelierDropzoneProps {
  onFilesSelect: (files: File[]) => void;
  isProcessing?: boolean;
  processingCount?: number;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function AtelierDropzone({
  onFilesSelect,
  isProcessing = false,
  processingCount = 0,
  disabled = false,
}: AtelierDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      inputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        ACCEPTED_TYPES.includes(file.type)
      );
      if (files.length > 0) {
        onFilesSelect(files);
      }
      // Reset input
      e.target.value = '';
    },
    [onFilesSelect]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled || isProcessing) return;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        ACCEPTED_TYPES.includes(file.type)
      );
      if (files.length > 0) {
        onFilesSelect(files);
      }
    },
    [onFilesSelect, disabled, isProcessing]
  );

  return (
    <motion.div
      whileHover={{ scale: disabled || isProcessing ? 1 : 1.01 }}
      whileTap={{ scale: disabled || isProcessing ? 1 : 0.99 }}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative w-full h-80 border-2 border-dashed rounded-[32px]',
        'flex flex-col items-center justify-center cursor-pointer group overflow-hidden',
        'transition-all duration-300',
        isDragActive
          ? 'border-purple-500 bg-purple-50/60'
          : 'border-purple-200 bg-white/40 hover:bg-white/60 hover:border-purple-400',
        (disabled || isProcessing) && 'opacity-60 cursor-not-allowed'
      )}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
        className="hidden"
      />

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {isProcessing ? (
        <>
          <div className="relative z-10 w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
            <Loader2 className="text-purple-500 animate-spin" size={48} />
          </div>
          <p className="relative z-10 text-2xl font-serif text-gray-800">분석 중...</p>
          <p className="relative z-10 text-sm text-gray-400 mt-2">
            {processingCount}장 처리 중
          </p>
        </>
      ) : (
        <>
          {/* Subtle breathing icon wrapper */}
          <motion.div
            className="relative z-10 w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
            animate={{
              scale: [1, 1.04, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Plus className="text-purple-500" size={48} />
          </motion.div>
          <p className="relative z-10 text-2xl font-serif text-gray-800">
            {isDragActive ? '여기에 놓으세요' : '사진을 드래그하세요'}
          </p>
          <p className="relative z-10 text-sm text-gray-400 mt-2 font-medium tracking-wide">
            또는 클릭하여 갤러리에서 선택
          </p>
        </>
      )}
    </motion.div>
  );
}
