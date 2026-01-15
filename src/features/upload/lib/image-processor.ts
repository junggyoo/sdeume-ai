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
 * Process and compress an image for upload
 */
export async function processImage(
  file: File,
  options: ImageProcessorOptions = {}
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Compress the image
  const compressedFile = await imageCompression(file, {
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
