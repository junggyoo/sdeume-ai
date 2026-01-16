import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';
import type {
  ModalGenerateRequest,
  ModalGenerateResponse,
  ShootJobImage,
} from '@/features/shooting/types';

// =============================================================================
// Types
// =============================================================================

export interface ModalClientConfig {
  endpointUrl: string;
  timeoutMs: number;
}

interface ProcessedImages {
  images: ShootJobImage[];
}

// =============================================================================
// Generate Images
// =============================================================================

export const generateImages = async (
  config: ModalClientConfig,
  request: ModalGenerateRequest
): Promise<HandlerResult<ModalGenerateResponse, string>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.endpointUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groomLoraUrl: request.groomLoraUrl,
        brideLoraUrl: request.brideLoraUrl,
        prompt: request.prompt,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error || `Modal API error: ${response.status}`;
      return failure(response.status as ContentfulStatusCode, 'MODAL_GENERATION_ERROR', errorMessage);
    }

    const data: ModalGenerateResponse = await response.json();

    return success(data);
  } catch (error) {
    clearTimeout(timeoutId);

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('abort') || message.includes('AbortError')) {
      return failure(
        408,
        'MODAL_GENERATION_ERROR',
        `Request timed out after ${config.timeoutMs}ms`
      );
    }

    return failure(
      500,
      'MODAL_GENERATION_ERROR',
      `Failed to generate images: ${message}`
    );
  }
};

// =============================================================================
// Process Modal Response
// =============================================================================

export const processModalResponse = async (
  response: ModalGenerateResponse,
  projectId: string
): Promise<HandlerResult<ProcessedImages, string>> => {
  const processedImages: ShootJobImage[] = [];

  for (let i = 0; i < response.images.length; i++) {
    const image = response.images[i];

    try {
      // Validate base64
      const isValidBase64 = /^[A-Za-z0-9+/]+=*$/.test(image.base64.replace(/\s/g, ''));
      if (!isValidBase64) {
        // Skip invalid images but continue processing
        console.warn(`Invalid base64 for image ${i}`);
        continue;
      }

      // For now, create placeholder URLs
      // In production, this would upload to Supabase Storage and generate thumbnails/blur
      const timestamp = Date.now();
      const imageId = `${projectId}_${timestamp}_${i}`;

      // Placeholder URLs - actual implementation would upload to storage
      const baseUrl = `generated/${projectId}/${imageId}`;

      processedImages.push({
        url: `${baseUrl}/original.png`,
        blurUrl: `${baseUrl}/blur.png`,
        thumbnailUrl: `${baseUrl}/thumbnail.png`,
      });
    } catch (error) {
      console.warn(`Failed to process image ${i}:`, error);
      // Continue processing other images
    }
  }

  return success({ images: processedImages });
};

// =============================================================================
// Upload Image to Storage (placeholder for actual implementation)
// =============================================================================

interface UploadResult {
  url: string;
  blurUrl: string;
  thumbnailUrl: string;
}

export const uploadImageToStorage = async (
  _supabase: unknown,
  base64: string,
  projectId: string,
  index: number
): Promise<HandlerResult<UploadResult, string>> => {
  // This is a placeholder implementation
  // In production, this would:
  // 1. Decode base64 to Buffer
  // 2. Use Sharp to create thumbnail (300x300)
  // 3. Use Plaiceholder to generate BlurHash
  // 4. Upload original, thumbnail, and blur to Supabase Storage
  // 5. Return the public URLs

  const timestamp = Date.now();
  const imageId = `${projectId}_${timestamp}_${index}`;
  const baseUrl = `generated/${projectId}/${imageId}`;

  // For testing purposes, just return placeholder URLs
  return success({
    url: `${baseUrl}/original.png`,
    blurUrl: `${baseUrl}/blur.png`,
    thumbnailUrl: `${baseUrl}/thumbnail.png`,
  });
};

// =============================================================================
// Process and Upload All Images
// =============================================================================

export const processAndUploadImages = async (
  supabase: unknown,
  response: ModalGenerateResponse,
  projectId: string
): Promise<HandlerResult<ShootJobImage[], string>> => {
  const uploadedImages: ShootJobImage[] = [];

  for (let i = 0; i < response.images.length; i++) {
    const image = response.images[i];

    const uploadResult = await uploadImageToStorage(
      supabase,
      image.base64,
      projectId,
      i
    );

    if (uploadResult.ok) {
      uploadedImages.push({
        url: uploadResult.data.url,
        blurUrl: uploadResult.data.blurUrl,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
      });
    }
  }

  return success(uploadedImages);
};
