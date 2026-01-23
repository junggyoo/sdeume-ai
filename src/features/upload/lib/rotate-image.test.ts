import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock canvas context for rotation tests
const mockCanvasContext = vi.hoisted(() => ({
  translate: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(100 * 100 * 4),
    width: 100,
    height: 100,
  })),
}));

const mockToBlob = vi.hoisted(() => vi.fn());

describe('rotateImage90', () => {
  let originalCreateElement: typeof document.createElement;
  let mockCanvas: Partial<HTMLCanvasElement>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock functions
    mockCanvasContext.translate.mockClear();
    mockCanvasContext.rotate.mockClear();
    mockCanvasContext.drawImage.mockClear();
    mockToBlob.mockReset();

    // Default toBlob implementation
    mockToBlob.mockImplementation((callback: BlobCallback) => {
      callback(new Blob(['rotated-content'], { type: 'image/jpeg' }));
    });

    // Mock canvas element
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCanvasContext),
      toBlob: mockToBlob,
    };

    // Mock document.createElement
    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    // Mock Image constructor behavior
    const originalImage = global.Image;
    vi.spyOn(global, 'Image').mockImplementation(() => {
      const img = new originalImage();
      // Set default dimensions
      Object.defineProperty(img, 'width', { value: 100, writable: true });
      Object.defineProperty(img, 'height', { value: 200, writable: true });

      // Auto-trigger onload after setting src
      setTimeout(() => {
        if (img.onload) {
          img.onload(new Event('load'));
        }
      }, 0);

      return img;
    });

    // Mock URL.createObjectURL and revokeObjectURL
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a mock file
  function createMockFile(
    name: string = 'test.jpg',
    type: string = 'image/jpeg'
  ): File {
    const content = new Array(1024).fill('a').join('');
    return new File([content], name, { type });
  }

  describe('90-degree rotation', () => {
    it('should swap width and height for 90-degree rotation', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      // Start the rotation
      const resultPromise = rotateImage90(mockFile, 90);

      // Wait for async operations
      await vi.waitFor(() => {
        expect(mockCanvas.width).toBeDefined();
      });

      const result = await resultPromise;

      // Canvas dimensions should be swapped (original: 100x200 -> 200x100)
      expect(mockCanvas.width).toBe(200); // height becomes width
      expect(mockCanvas.height).toBe(100); // width becomes height
    });

    it('should apply correct transform for 90-degree clockwise rotation', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      await rotateImage90(mockFile, 90);

      // For 90-degree rotation:
      // translate to (height, 0) then rotate 90 degrees
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(200, 0);
      expect(mockCanvasContext.rotate).toHaveBeenCalledWith(Math.PI / 2);
    });

    it('should preserve file type for JPEG', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile('test.jpg', 'image/jpeg');

      const result = await rotateImage90(mockFile, 90);

      expect(mockToBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.95
      );
    });

    it('should preserve file type for PNG', async () => {
      mockToBlob.mockImplementation((callback: BlobCallback) => {
        callback(new Blob(['rotated-content'], { type: 'image/png' }));
      });

      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile('test.png', 'image/png');

      const result = await rotateImage90(mockFile, 90);

      expect(mockToBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        0.95
      );
    });
  });

  describe('-90-degree rotation', () => {
    it('should swap width and height for -90-degree rotation', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      const resultPromise = rotateImage90(mockFile, -90);

      await vi.waitFor(() => {
        expect(mockCanvas.width).toBeDefined();
      });

      await resultPromise;

      // Canvas dimensions should be swapped
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(100);
    });

    it('should apply correct transform for -90-degree rotation', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      await rotateImage90(mockFile, -90);

      // For -90-degree rotation:
      // translate to (0, width) then rotate -90 degrees
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(0, 100);
      expect(mockCanvasContext.rotate).toHaveBeenCalledWith(-Math.PI / 2);
    });
  });

  describe('180-degree rotation', () => {
    it('should maintain width and height for 180-degree rotation', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      const resultPromise = rotateImage90(mockFile, 180);

      await vi.waitFor(() => {
        expect(mockCanvas.width).toBeDefined();
      });

      await resultPromise;

      // Canvas dimensions should remain same
      expect(mockCanvas.width).toBe(100);
      expect(mockCanvas.height).toBe(200);
    });

    it('should apply correct transform for 180-degree rotation', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      await rotateImage90(mockFile, 180);

      // For 180-degree rotation:
      // translate to (width, height) then rotate 180 degrees
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(100, 200);
      expect(mockCanvasContext.rotate).toHaveBeenCalledWith(Math.PI);
    });
  });

  describe('error handling', () => {
    it('should reject when toBlob fails', async () => {
      mockToBlob.mockImplementation((callback: BlobCallback) => {
        callback(null);
      });

      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      await expect(rotateImage90(mockFile, 90)).rejects.toThrow(
        '이미지 회전에 실패했습니다'
      );
    });

    it('should reject when canvas context is not available', async () => {
      mockCanvas.getContext = vi.fn().mockReturnValue(null);

      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      await expect(rotateImage90(mockFile, 90)).rejects.toThrow(
        '이미지 회전에 실패했습니다'
      );
    });
  });

  describe('file naming', () => {
    it('should preserve original filename', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile('my-photo.jpg', 'image/jpeg');

      const result = await rotateImage90(mockFile, 90);

      expect(result.name).toBe('my-photo.jpg');
    });

    it('should preserve file type in result', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile('test.jpg', 'image/jpeg');

      const result = await rotateImage90(mockFile, 90);

      expect(result.type).toBe('image/jpeg');
    });
  });

  describe('WebP file handling', () => {
    it('should preserve WebP file type', async () => {
      mockToBlob.mockImplementation((callback: BlobCallback) => {
        callback(new Blob(['rotated-content'], { type: 'image/webp' }));
      });

      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile('test.webp', 'image/webp');

      const result = await rotateImage90(mockFile, 90);

      expect(mockToBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        0.95
      );
    });
  });

  describe('memory cleanup', () => {
    it('should clean up blob URL after successful rotation', async () => {
      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      await rotateImage90(mockFile, 90);

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should clean up blob URL even when rotation fails', async () => {
      mockToBlob.mockImplementation((callback: BlobCallback) => {
        callback(null);
      });

      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      try {
        await rotateImage90(mockFile, 90);
      } catch {
        // Expected to fail
      }

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('image load failure', () => {
    it('should reject when image fails to load', async () => {
      // Reset and override Image mock to trigger error
      vi.restoreAllMocks();

      // Setup URL mocks again after restore
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      vi.spyOn(global, 'Image').mockImplementation(() => {
        const img = {
          width: 0,
          height: 0,
          src: '',
          onload: null as ((ev: Event) => void) | null,
          onerror: null as ((ev: Event) => void) | null,
        };

        // Use defineProperty to make src trigger onerror
        Object.defineProperty(img, 'src', {
          set() {
            setTimeout(() => {
              if (img.onerror) {
                img.onerror(new Event('error'));
              }
            }, 0);
          },
          get() {
            return '';
          },
        });

        return img as unknown as HTMLImageElement;
      });

      const { rotateImage90 } = await import('./rotate-image');
      const mockFile = createMockFile();

      await expect(rotateImage90(mockFile, 90)).rejects.toThrow(
        '이미지 로드에 실패했습니다'
      );
    });
  });
});
