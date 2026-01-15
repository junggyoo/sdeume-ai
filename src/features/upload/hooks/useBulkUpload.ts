'use client';

import { useCallback, useState } from 'react';
import { useUploadStore } from '../store/upload-store';
import { processImage } from '../lib/image-processor';
import { analyzeFaceFromFile } from '../lib/face-mesh';
import type { UploadRole, QueuedFile, BucketSummary } from '../types';
import { MIN_IMAGES_TO_PROCEED, BUCKET_TARGETS } from '../types';

interface UseBulkUploadOptions {
  projectId: string;
  role: UploadRole;
  onUploadComplete?: (item: QueuedFile) => void;
}

interface UseBulkUploadReturn {
  // State
  isProcessing: boolean;
  processingCount: number;
  queue: QueuedFile[];
  bucketSummary: BucketSummary;

  // Actions
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearQueue: () => void;

  // Validation
  canProceed: boolean;
  needsMoreFrontal: boolean;
  needsMoreSide: boolean;
  gapFillingMessage: string | null;
}

export function useBulkUpload({
  projectId,
  role,
  onUploadComplete,
}: UseBulkUploadOptions): UseBulkUploadReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);

  const {
    getQueue,
    addToQueue,
    updateQueueItem,
    removeFromQueue,
    clearQueue: clearStoreQueue,
    getBucketSummary,
  } = useUploadStore();

  const queue = getQueue(role);
  const bucketSummary = getBucketSummary(role);

  // Validation
  const canProceed = bucketSummary.total >= MIN_IMAGES_TO_PROCEED;
  const needsMoreFrontal = bucketSummary.bucketA < BUCKET_TARGETS.A.min;
  const needsMoreSide = bucketSummary.bucketB < BUCKET_TARGETS.B.min;

  // Generate gap filling message
  const gapFillingMessage = (() => {
    if (bucketSummary.total === 0) return null;

    const messages: string[] = [];

    if (needsMoreFrontal) {
      const needed = BUCKET_TARGETS.A.min - bucketSummary.bucketA;
      messages.push(`정면 사진 ${needed}장`);
    }

    if (needsMoreSide) {
      const needed = BUCKET_TARGETS.B.min - bucketSummary.bucketB;
      messages.push(`옆모습 사진 ${needed}장`);
    }

    if (messages.length === 0) return null;

    return `${messages.join('과 ')}이 더 필요해요`;
  })();

  // Process a single file
  const processFile = useCallback(
    async (item: QueuedFile) => {
      try {
        // Update status to analyzing
        updateQueueItem(item.id, role, { status: 'analyzing', progress: 10 });

        // Compress image
        const processed = await processImage(item.file);
        updateQueueItem(item.id, role, { progress: 40 });

        // Analyze face
        const analysis = await analyzeFaceFromFile(processed.file);
        updateQueueItem(item.id, role, {
          status: 'completed',
          progress: 100,
          analysis,
        });

        onUploadComplete?.({ ...item, status: 'completed', analysis });
      } catch (error) {
        updateQueueItem(item.id, role, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Analysis failed',
        });
      }
    },
    [role, updateQueueItem, onUploadComplete]
  );

  // Add files to queue and process
  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsProcessing(true);
      setProcessingCount(fileArray.length);

      // Add to queue
      const newItems = addToQueue(fileArray, role);

      // Process all files concurrently (with limit)
      const CONCURRENT_LIMIT = 3;
      const chunks: QueuedFile[][] = [];

      for (let i = 0; i < newItems.length; i += CONCURRENT_LIMIT) {
        chunks.push(newItems.slice(i, i + CONCURRENT_LIMIT));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(processFile));
      }

      setIsProcessing(false);
      setProcessingCount(0);
    },
    [role, addToQueue, processFile]
  );

  // Remove file from queue
  const removeFile = useCallback(
    (id: string) => {
      removeFromQueue(id, role);
    },
    [role, removeFromQueue]
  );

  // Clear all files
  const clearQueue = useCallback(() => {
    clearStoreQueue(role);
  }, [role, clearStoreQueue]);

  return {
    isProcessing,
    processingCount,
    queue,
    bucketSummary,
    addFiles,
    removeFile,
    clearQueue,
    canProceed,
    needsMoreFrontal,
    needsMoreSide,
    gapFillingMessage,
  };
}
