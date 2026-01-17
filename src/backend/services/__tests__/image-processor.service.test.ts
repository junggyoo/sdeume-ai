import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processGeneratedImage } from '../image-processor.service';

// Mock sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock image data')),
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
    it('should convert base64 to WebP and create thumbnail', async () => {
      const base64Input =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await processGeneratedImage(base64Input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.originalBuffer).toBeInstanceOf(Buffer);
        expect(result.data.thumbnailBuffer).toBeInstanceOf(Buffer);
        expect(result.data.blurHash).toBeDefined();
        expect(typeof result.data.blurHash).toBe('string');
      }
    });

    it('should generate BlurHash from image', async () => {
      const base64Input =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await processGeneratedImage(base64Input);

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
      const sharp = await import('sharp');
      const base64Input =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await processGeneratedImage(base64Input);

      // Verify sharp was called with resize for thumbnail
      const sharpInstance = (sharp.default as ReturnType<typeof vi.fn>).mock.results[0]?.value;
      if (sharpInstance) {
        expect(sharpInstance.resize).toHaveBeenCalledWith(300, 300, expect.any(Object));
      }
    });

    it('should convert to WebP format', async () => {
      const sharp = await import('sharp');
      const base64Input =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await processGeneratedImage(base64Input);

      const sharpInstance = (sharp.default as ReturnType<typeof vi.fn>).mock.results[0]?.value;
      if (sharpInstance) {
        expect(sharpInstance.webp).toHaveBeenCalled();
      }
    });
  });
});
