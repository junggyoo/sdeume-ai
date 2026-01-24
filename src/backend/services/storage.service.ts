import type { SupabaseClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import sharp from 'sharp';
import pLimit from 'p-limit';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import { processGeneratedImage } from './image-processor.service';
import type { UploadRole } from '@/features/upload/types';
import { STORAGE_BUCKET, SIGNED_URL_EXPIRY } from '@/backend/config/storage';

// =============================================================================
// Training ZIP Constants
// =============================================================================

const CONCURRENT_DOWNLOADS = 10; // Max concurrent image downloads for ZIP creation

// =============================================================================
// Types
// =============================================================================

export interface UploadedImageResult {
  originalUrl: string;
  thumbnailUrl: string;
  blurHash: string;
}

// =============================================================================
// Error Codes
// =============================================================================

const storageErrorCodes = {
  uploadError: 'STORAGE_UPLOAD_ERROR',
  noImagesFound: 'NO_IMAGES_FOUND',
  databaseError: 'DATABASE_ERROR',
  imageFetchError: 'IMAGE_FETCH_ERROR',
  invalidInput: 'INVALID_INPUT',
} as const;

type StorageErrorCode = (typeof storageErrorCodes)[keyof typeof storageErrorCodes];

// =============================================================================
// uploadTrainingImage
// =============================================================================

export const uploadTrainingImage = async (
  supabase: SupabaseClient,
  _userId: string,
  projectId: string,
  role: UploadRole,
  file: File
): Promise<HandlerResult<string, StorageErrorCode>> => {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `uploads/${projectId}/${role}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, uint8Array, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return failure(500, storageErrorCodes.uploadError, uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return success(publicUrl);
};

// =============================================================================
// createTrainingZip
// =============================================================================

export const createTrainingZip = async (
  supabase: SupabaseClient,
  projectId: string,
  role: UploadRole
): Promise<HandlerResult<string, StorageErrorCode>> => {
  // 1. Fetch image URLs from uploads table
  const { data: uploads, error: dbError } = await supabase
    .from('uploads')
    .select('original_url')
    .eq('project_id', projectId)
    .eq('role', role);

  if (dbError) {
    return failure(500, storageErrorCodes.databaseError, dbError.message);
  }

  if (!uploads || uploads.length === 0) {
    return failure(400, storageErrorCodes.noImagesFound, 'No images found for training');
  }

  // 2. Download images in parallel and add to ZIP
  // No re-compression: images are already optimized on client-side upload
  const zip = new JSZip();
  const limit = pLimit(CONCURRENT_DOWNLOADS);

  // Track errors during parallel processing
  let fetchError: { url: string } | null = null;

  const processPromises = uploads.map((upload, index) =>
    limit(async () => {
      // Skip if a previous fetch already failed
      if (fetchError) return;

      const response = await fetch(upload.original_url);
      if (!response.ok) {
        fetchError = { url: upload.original_url };
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileName = `image_${index.toString().padStart(3, '0')}.jpg`;

      // Use original buffer directly - no double compression
      zip.file(fileName, Buffer.from(arrayBuffer));
    })
  );

  await Promise.all(processPromises);

  // Check if any fetch failed
  if (fetchError) {
    return failure(500, storageErrorCodes.imageFetchError, `Failed to fetch image: ${fetchError.url}`);
  }

  // 3. Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // 4. Upload ZIP to storage
  const zipPath = `training-images/${projectId}/${role}/images.zip`;
  const zipArrayBuffer = await zipBlob.arrayBuffer();
  const zipUint8Array = new Uint8Array(zipArrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(zipPath, zipUint8Array, {
      contentType: 'application/zip',
      upsert: true,
    });

  if (uploadError) {
    return failure(500, storageErrorCodes.uploadError, uploadError.message);
  }

  // 5. Create signed URL for Fal.ai to access
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(zipPath, SIGNED_URL_EXPIRY);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return failure(500, storageErrorCodes.uploadError, 'Failed to create signed URL');
  }

  return success(signedUrlData.signedUrl);
};

// =============================================================================
// uploadGeneratedImage
// =============================================================================

export const uploadGeneratedImage = async (
  supabase: SupabaseClient,
  projectId: string,
  generationId: string,
  index: number,
  base64Image: string
): Promise<HandlerResult<UploadedImageResult, StorageErrorCode>> => {
  // Validate base64 input
  if (!base64Image.startsWith('data:image/')) {
    return failure(400, storageErrorCodes.invalidInput, 'Invalid base64 image format');
  }

  // Process image with Sharp
  const processResult = await processGeneratedImage(base64Image);
  if (!processResult.ok) {
    return failure(400, storageErrorCodes.invalidInput, 'Failed to process image');
  }

  const { originalBuffer, thumbnailBuffer, blurHash } = processResult.data;

  // Upload original
  const originalPath = `generated/${projectId}/${generationId}/${index}_original.webp`;
  const { error: originalError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(originalPath, originalBuffer, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (originalError) {
    return failure(500, storageErrorCodes.uploadError, originalError.message);
  }

  // Upload thumbnail
  const thumbnailPath = `generated/${projectId}/${generationId}/${index}_thumbnail.webp`;
  const { error: thumbnailError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(thumbnailPath, thumbnailBuffer, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (thumbnailError) {
    return failure(500, storageErrorCodes.uploadError, thumbnailError.message);
  }

  // Get public URLs
  const {
    data: { publicUrl: originalUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(originalPath);

  const {
    data: { publicUrl: thumbnailUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(thumbnailPath);

  return success({
    originalUrl,
    thumbnailUrl,
    blurHash,
  });
};
