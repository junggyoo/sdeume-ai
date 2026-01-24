import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processGeneratedImage } from '../image-processor.service';

// Create mock functions to track calls
const mockResize = vi.fn().mockReturnThis();
const mockWebp = vi.fn().mockReturnThis();
const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from('mock image data'));

// Mock sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: mockResize,
    webp: mockWebp,
    toBuffer: mockToBuffer,
  })),
}));

// Mock plaiceholder
vi.mock('plaiceholder', () => ({
  getPlaiceholder: vi.fn().mockResolvedValue({
    base64: 'data:image/png;base64,mockBlurHash',
  }),
}));

describe('Image Processor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processGeneratedImage', () => {
    const validBase64Input =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('should convert base64 to WebP and create thumbnail', async () => {
      const result = await processGeneratedImage(validBase64Input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.originalBuffer).toBeInstanceOf(Buffer);
        expect(result.data.thumbnailBuffer).toBeInstanceOf(Buffer);
        expect(result.data.blurHash).toBeDefined();
        expect(typeof result.data.blurHash).toBe('string');
      }
    });

    it('should generate BlurHash from image', async () => {
      const result = await processGeneratedImage(validBase64Input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.blurHash).toContain('data:image');
      }
    });

    it('should return failure for invalid base64 input', async () => {
      const invalidInput = 'not-a-valid-base64';

      const result = await processGeneratedImage(invalidInput);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('should create thumbnail with correct dimensions (300x300)', async () => {
      await processGeneratedImage(validBase64Input);

      // Verify resize was called with thumbnail dimensions
      expect(mockResize).toHaveBeenCalledWith(300, 300, {
        fit: 'cover',
        position: 'center',
      });
    });

    it('should convert to WebP format', async () => {
      await processGeneratedImage(validBase64Input);

      // Verify webp was called (twice: once for original, once for thumbnail)
      expect(mockWebp).toHaveBeenCalled();
      expect(mockWebp).toHaveBeenCalledWith({ quality: 85 });
    });
  });
});
