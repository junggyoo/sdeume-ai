import sharp from 'sharp';
import { getPlaiceholder } from 'plaiceholder';
import {
  success,
  failure,
  type HandlerResult,
} from '@/backend/http/response';

// =============================================================================
// Types
// =============================================================================

export interface ProcessedImage {
  originalBuffer: Buffer;
  thumbnailBuffer: Buffer;
  blurHash: string;
}

// =============================================================================
// Error Codes
// =============================================================================

const processorErrorCodes = {
  invalidInput: 'INVALID_INPUT',
  processingError: 'PROCESSING_ERROR',
} as const;

type ProcessorErrorCode = (typeof processorErrorCodes)[keyof typeof processorErrorCodes];

// =============================================================================
// Constants
// =============================================================================

const THUMBNAIL_SIZE = 300;
const WEBP_QUALITY = 85;

// =============================================================================
// processGeneratedImage
// =============================================================================

export const processGeneratedImage = async (
  base64Image: string
): Promise<HandlerResult<ProcessedImage, ProcessorErrorCode>> => {
  // Validate base64 input
  if (!base64Image.startsWith('data:image/')) {
    return failure(400, processorErrorCodes.invalidInput, 'Invalid base64 image format');
  }

  try {
    // Extract base64 data (remove data:image/xxx;base64, prefix)
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) {
      return failure(400, processorErrorCodes.invalidInput, 'Invalid base64 data');
    }

    const inputBuffer = Buffer.from(base64Data, 'base64');

    // Create original WebP
    const originalBuffer = await sharp(inputBuffer)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Create thumbnail WebP
    const thumbnailBuffer = await sharp(inputBuffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // Generate BlurHash using Plaiceholder
    const { base64: blurHash } = await getPlaiceholder(inputBuffer);

    return success({
      originalBuffer,
      thumbnailBuffer,
      blurHash,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error';
    return failure(500, processorErrorCodes.processingError, message);
  }
};
