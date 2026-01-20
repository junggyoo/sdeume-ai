import imageCompression from 'browser-image-compression';

export interface ProcessedImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export interface ImageProcessorOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  convertToWebP?: boolean;
}

const DEFAULT_OPTIONS: ImageProcessorOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.8,
  convertToWebP: true,
};

/**
 * Check if a file is HEIC/HEIF format
 */
function isHeicFile(file: File): boolean {
  const heicTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
  const heicExtensions = ['.heic', '.heif'];

  // Check MIME type
  if (heicTypes.includes(file.type.toLowerCase())) {
    return true;
  }

  // Check file extension (some browsers don't set correct MIME type for HEIC)
  const fileName = file.name.toLowerCase();
  return heicExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Convert HEIC/HEIF file to JPEG
 * Uses heic-decode + Canvas for client-side conversion
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  console.log(`[ImageProcessor] Converting HEIC to JPEG: ${file.name}`);

  try {
    // Dynamic import to avoid SSR issues
    const decode = (await import('heic-decode')).default;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Decode HEIC to raw pixel data
    const decoded = await decode({ buffer: arrayBuffer });
    const { width, height, data } = decoded;

    // Create canvas and draw the decoded image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Create ImageData from decoded RGBA data
    // Handle different data formats from heic-decode
    const length = width * height * 4;
    const pixelData = new Uint8ClampedArray(length);

    // Copy data manually to ensure compatibility
    for (let i = 0; i < length; i++) {
      pixelData[i] = (data as unknown as ArrayLike<number>)[i] ?? 0;
    }

    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixelData);
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to JPEG blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob from canvas'));
        },
        'image/jpeg',
        0.95
      );
    });

    // Create new filename with .jpg extension
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');

    const convertedFile = new File([blob], newName, { type: 'image/jpeg' });
    console.log(`[ImageProcessor] HEIC conversion complete: ${file.size} bytes -> ${convertedFile.size} bytes`);

    return convertedFile;
  } catch (error) {
    console.error('[ImageProcessor] HEIC conversion failed:', error);
    throw new Error(`HEIC 변환에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize image orientation by "baking" the browser's auto-rotation into pixels.
 *
 * Modern browsers (Chrome, Safari, Firefox) automatically apply EXIF orientation
 * when loading images via `new Image()`. This means the image appears correctly
 * rotated in the browser, but the underlying pixel data still has the original orientation.
 *
 * This function draws the browser-rendered image (already visually correct) onto a canvas,
 * effectively "baking" the rotation into the actual pixels. The resulting image will:
 * - Display correctly everywhere (including tools that don't respect EXIF)
 * - Have EXIF orientation stripped or set to 1 (normal)
 *
 * No manual rotation logic is needed - we simply trust the browser's rendering.
 */
export async function normalizeImageOrientation(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.warn('[ImageProcessor] Failed to get canvas context');
        resolve(file);
        return;
      }

      // Use the browser's rendered dimensions (already rotated correctly)
      canvas.width = img.width;
      canvas.height = img.height;

      // Simply draw the image - browser has already applied EXIF rotation
      ctx.drawImage(img, 0, 0);

      console.log(`[ImageProcessor] Baking orientation: ${img.width}x${img.height}`);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn('[ImageProcessor] Failed to create blob from canvas');
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          }));
        },
        file.type,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.warn('[ImageProcessor] Failed to load image for normalization');
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Process and compress an image for upload
 */
export async function processImage(
  file: File,
  options: ImageProcessorOptions = {}
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Convert HEIC to JPEG first (if needed)
  const jpegFile = await convertHeicToJpeg(file);

  // Normalize orientation before compression (bake rotation into pixels)
  const normalizedFile = await normalizeImageOrientation(jpegFile);

  // Compress the normalized image
  const compressedFile = await imageCompression(normalizedFile, {
    maxWidthOrHeight: Math.max(opts.maxWidth!, opts.maxHeight!),
    useWebWorker: true,
    fileType: opts.convertToWebP ? 'image/webp' : undefined,
    initialQuality: opts.quality,
  });

  // Get dimensions
  const dimensions = await getImageDimensions(compressedFile);

  // Create preview URL
  const previewUrl = URL.createObjectURL(compressedFile);

  return {
    file: compressedFile,
    previewUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Create an HTMLImageElement from a file
 */
export function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert a data URL to a Blob
 */
export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Clean up preview URLs to prevent memory leaks
 */
export function revokePreviewUrls(urls: string[]): void {
  urls.forEach((url) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}
