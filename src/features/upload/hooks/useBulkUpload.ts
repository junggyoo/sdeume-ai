'use client';

import { useCallback, useState } from 'react';
import { useUploadStore } from '../store/upload-store';
import { processImage } from '../lib/image-processor';
import { analyzeFaceFromFile, analyzeForRotationFromFile } from '../lib/face-mesh';
import { rotateImage90 } from '../lib/rotate-image';
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
    addToQueueAsync,
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

  // Yield to main thread to allow UI updates (prevents spinner jank)
  const yieldToMain = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0);
      });
    });
  }, []);

  // Process a single file
  const processFile = useCallback(
    async (item: QueuedFile) => {
      try {
        // Update status to analyzing
        updateQueueItem(item.id, role, { status: 'analyzing', progress: 10 });

        // Yield before heavy operations
        await yieldToMain();

        // Step 1: Preliminary rotation check (20%)
        let fileToProcess = item.file;
        let wasRotated = false;
        let rotationApplied: 0 | 90 | -90 | 180 = 0;

        const rotationCheck = await analyzeForRotationFromFile(item.file);
        updateQueueItem(item.id, role, { progress: 20 });

        // Step 2: Apply rotation if needed (30%)
        if (rotationCheck?.needsRotation && rotationCheck.correctionDegrees !== 0) {
          await yieldToMain();
          const rotationDegrees = rotationCheck.correctionDegrees as 90 | -90 | 180;
          fileToProcess = await rotateImage90(item.file, rotationDegrees);
          wasRotated = true;
          rotationApplied = rotationDegrees;
          console.log(`[useBulkUpload] Applied ${rotationDegrees}° rotation to ${item.file.name}`);
        }
        updateQueueItem(item.id, role, { progress: 30 });

        // Yield before compression
        await yieldToMain();

        // Step 3: Compress image (60%)
        const processed = await processImage(fileToProcess);
        updateQueueItem(item.id, role, { progress: 60 });

        // Yield between compression and analysis
        await yieldToMain();

        // Step 4: Final face analysis (100%)
        const analysis = await analyzeFaceFromFile(processed.file);

        // Add rotation info to analysis result
        const enrichedAnalysis = {
          ...analysis,
          wasRotated,
          rotationApplied,
        };

        updateQueueItem(item.id, role, {
          status: 'completed',
          progress: 100,
          analysis: enrichedAnalysis,
        });

        onUploadComplete?.({ ...item, status: 'completed', analysis: enrichedAnalysis });
      } catch (error) {
        updateQueueItem(item.id, role, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Analysis failed',
        });
      }
    },
    [role, updateQueueItem, onUploadComplete, yieldToMain]
  );

  // Add files to queue and process
  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsProcessing(true);
      setProcessingCount(fileArray.length);

      // Add to queue with async batch processing for better UI responsiveness
      const newItems = await addToQueueAsync(fileArray, role);

      // Yield before starting to ensure UI updates
      await yieldToMain();

      // Process files sequentially to prevent main thread blocking
      // This ensures smoother UI updates and spinner animation
      for (let i = 0; i < newItems.length; i++) {
        await processFile(newItems[i]);
        setProcessingCount(newItems.length - i - 1);
        // Yield after each file to allow UI to update
        await yieldToMain();
      }

      setIsProcessing(false);
      setProcessingCount(0);
    },
    [role, addToQueueAsync, processFile, yieldToMain]
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
