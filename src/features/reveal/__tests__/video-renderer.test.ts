import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  easeInOutCubic,
  getKenBurnsTransform,
  getActiveImages,
  generateKenBurnsScenes,
  renderFrame,
  MOVIE_CONFIG,
  type KenBurnsScene,
} from '../lib/video-renderer';

describe('video-renderer', () => {
  describe('easeInOutCubic', () => {
    it('should return 0 at progress 0', () => {
      expect(easeInOutCubic(0)).toBe(0);
    });

    it('should return 1 at progress 1', () => {
      expect(easeInOutCubic(1)).toBe(1);
    });

    it('should return 0.5 at progress 0.5', () => {
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });

    it('should have slow start (value < linear at 0.25)', () => {
      const result = easeInOutCubic(0.25);
      expect(result).toBeLessThan(0.25);
    });

    it('should have slow end (value > linear at 0.75)', () => {
      const result = easeInOutCubic(0.75);
      expect(result).toBeGreaterThan(0.75);
    });

    it('should be monotonically increasing', () => {
      const values = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(
        easeInOutCubic
      );
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  });

  describe('getKenBurnsTransform', () => {
    const mockScene: KenBurnsScene = {
      startScale: 1.0,
      endScale: 1.15,
      startX: 0,
      startY: 0,
      endX: 0.05,
      endY: -0.03,
    };

    it('should return start values at progress 0', () => {
      const result = getKenBurnsTransform(mockScene, 0);
      expect(result.scale).toBe(1.0);
      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(0);
    });

    it('should return end values at progress 1', () => {
      const result = getKenBurnsTransform(mockScene, 1);
      expect(result.scale).toBe(1.15);
      expect(result.offsetX).toBe(0.05);
      expect(result.offsetY).toBe(-0.03);
    });

    it('should return interpolated values at progress 0.5', () => {
      const result = getKenBurnsTransform(mockScene, 0.5);
      // At 0.5, easeInOutCubic returns 0.5, so:
      // scale: 1.0 + (1.15 - 1.0) * 0.5 = 1.075
      // offsetX: 0 + 0.05 * 0.5 = 0.025
      // offsetY: 0 + (-0.03) * 0.5 = -0.015
      expect(result.scale).toBeCloseTo(1.075, 5);
      expect(result.offsetX).toBeCloseTo(0.025, 5);
      expect(result.offsetY).toBeCloseTo(-0.015, 5);
    });

    it('should apply easing at 0.25 progress', () => {
      const result = getKenBurnsTransform(mockScene, 0.25);
      // easeInOutCubic(0.25) = 4 * 0.25^3 = 0.0625
      const expectedEased = 0.0625;
      expect(result.scale).toBeCloseTo(1.0 + 0.15 * expectedEased, 5);
    });
  });

  describe('getActiveImages', () => {
    // MOVIE_CONFIG: framesPerImage = 90, transitionFrames = 15, imageCount = 5

    it('should return first image only at frame 0', () => {
      const result = getActiveImages(0);
      expect(result.imageA).toBe(0);
      expect(result.imageB).toBeNull();
      expect(result.blendFactor).toBe(0);
    });

    it('should return first image only at frame 74 (before transition)', () => {
      // Transition starts at frame 75 (90 - 15)
      const result = getActiveImages(74);
      expect(result.imageA).toBe(0);
      expect(result.imageB).toBeNull();
      expect(result.blendFactor).toBe(0);
    });

    it('should return two images during transition (frame 80)', () => {
      // Frame 80 = middle of transition between image 0 and 1
      const result = getActiveImages(80);
      expect(result.imageA).toBe(0);
      expect(result.imageB).toBe(1);
      expect(result.blendFactor).toBeGreaterThan(0);
    });

    it('should have blendFactor at 0 at start of transition', () => {
      const result = getActiveImages(75);
      // At frame 75: (75 - 75) / 15 = 0
      expect(result.blendFactor).toBeCloseTo(0, 5);
    });

    it('should have blendFactor approaching 1 at end of transition', () => {
      const result = getActiveImages(89);
      // At frame 89: (89 - 75) / 15 = 14/15 ≈ 0.93
      expect(result.blendFactor).toBeGreaterThan(0.8);
      expect(result.blendFactor).toBeLessThan(1);
    });

    it('should transition to second image at frame 90', () => {
      const result = getActiveImages(90);
      expect(result.imageA).toBe(1);
      expect(result.imageB).toBeNull();
      expect(result.blendFactor).toBe(0);
    });

    it('should not transition from last image', () => {
      // Frame 360-449 is the last image (index 4)
      const result = getActiveImages(435); // Last 15 frames of last image
      expect(result.imageA).toBe(4);
      expect(result.imageB).toBeNull();
      expect(result.blendFactor).toBe(0);
    });

    it('should handle frame at exact boundary', () => {
      const result = getActiveImages(180); // Start of third image
      expect(result.imageA).toBe(2);
      expect(result.imageB).toBeNull();
    });

    it('should calculate correct image index for middle frames', () => {
      const result = getActiveImages(225); // Middle of third image
      expect(result.imageA).toBe(2);
    });
  });

  describe('generateKenBurnsScenes', () => {
    it('should generate correct number of scenes', () => {
      const scenes = generateKenBurnsScenes(5);
      expect(scenes.length).toBe(5);
    });

    it('should alternate between zoom in and zoom out', () => {
      const scenes = generateKenBurnsScenes(4);

      // Even indices: zoom in (startScale < endScale)
      expect(scenes[0].startScale).toBeLessThan(scenes[0].endScale);
      expect(scenes[2].startScale).toBeLessThan(scenes[2].endScale);

      // Odd indices: zoom out (startScale > endScale)
      expect(scenes[1].startScale).toBeGreaterThan(scenes[1].endScale);
      expect(scenes[3].startScale).toBeGreaterThan(scenes[3].endScale);
    });

    it('should have scales within reasonable bounds (1.0 to 1.15)', () => {
      const scenes = generateKenBurnsScenes(5);
      scenes.forEach((scene) => {
        expect(Math.min(scene.startScale, scene.endScale)).toBeGreaterThanOrEqual(1.0);
        expect(Math.max(scene.startScale, scene.endScale)).toBeLessThanOrEqual(1.2);
      });
    });

    it('should have offsets within reasonable bounds', () => {
      const scenes = generateKenBurnsScenes(5);
      scenes.forEach((scene) => {
        expect(Math.abs(scene.startX)).toBeLessThanOrEqual(0.1);
        expect(Math.abs(scene.endX)).toBeLessThanOrEqual(0.1);
        expect(Math.abs(scene.startY)).toBeLessThanOrEqual(0.1);
        expect(Math.abs(scene.endY)).toBeLessThanOrEqual(0.1);
      });
    });

    it('should generate empty array for 0 images', () => {
      const scenes = generateKenBurnsScenes(0);
      expect(scenes).toEqual([]);
    });
  });

  describe('renderFrame', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockCtx: CanvasRenderingContext2D;
    let mockImages: HTMLImageElement[];

    beforeEach(() => {
      // Create mock canvas and context
      mockCanvas = document.createElement('canvas');
      mockCanvas.width = 1080;
      mockCanvas.height = 1920;

      mockCtx = {
        canvas: mockCanvas,
        fillStyle: '',
        globalAlpha: 1,
        fillRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      // Create mock images
      mockImages = Array.from({ length: 5 }, (_, i) => {
        const img = new Image();
        Object.defineProperty(img, 'width', { value: 1080 });
        Object.defineProperty(img, 'height', { value: 1620 }); // 2:3 aspect
        return img;
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should clear canvas with black background', () => {
      const scenes = generateKenBurnsScenes(5);
      renderFrame(mockCtx, mockImages, 0, scenes);

      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 1080, 1920);
    });

    it('should draw single image when not in transition', () => {
      const scenes = generateKenBurnsScenes(5);
      renderFrame(mockCtx, mockImages, 0, scenes);

      // Should call drawImage once
      expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
    });

    it('should draw two images during transition', () => {
      const scenes = generateKenBurnsScenes(5);
      renderFrame(mockCtx, mockImages, 80, scenes); // During transition

      // Should call drawImage twice (one for each blending image)
      expect(mockCtx.drawImage).toHaveBeenCalledTimes(2);
    });

    it('should apply scale transformation', () => {
      const scenes = generateKenBurnsScenes(5);
      renderFrame(mockCtx, mockImages, 45, scenes); // Middle of first image

      expect(mockCtx.scale).toHaveBeenCalled();
    });

    it('should save and restore context for each image', () => {
      const scenes = generateKenBurnsScenes(5);
      renderFrame(mockCtx, mockImages, 0, scenes);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should set globalAlpha for blending during transition', () => {
      const scenes = generateKenBurnsScenes(5);

      // Spy on globalAlpha setter
      const alphaValues: number[] = [];
      Object.defineProperty(mockCtx, 'globalAlpha', {
        set: (value: number) => alphaValues.push(value),
        get: () => alphaValues[alphaValues.length - 1] ?? 1,
      });

      renderFrame(mockCtx, mockImages, 80, scenes);

      // Should have set alpha values for blending
      expect(alphaValues.length).toBeGreaterThan(0);
      // Last value should be 1 (reset)
      expect(alphaValues[alphaValues.length - 1]).toBe(1);
    });

    it('should center the canvas coordinate system', () => {
      const scenes = generateKenBurnsScenes(5);
      renderFrame(mockCtx, mockImages, 0, scenes);

      // Should translate to center
      expect(mockCtx.translate).toHaveBeenCalledWith(540, 960); // 1080/2, 1920/2
    });
  });

  describe('MOVIE_CONFIG', () => {
    it('should have correct total duration', () => {
      expect(MOVIE_CONFIG.totalDuration).toBe(15);
    });

    it('should have correct fps', () => {
      expect(MOVIE_CONFIG.fps).toBe(30);
    });

    it('should have correct total frames', () => {
      expect(MOVIE_CONFIG.totalFrames).toBe(450); // 15 * 30
    });

    it('should have correct image count', () => {
      expect(MOVIE_CONFIG.imageCount).toBe(5);
    });

    it('should have correct frames per image', () => {
      expect(MOVIE_CONFIG.framesPerImage).toBe(90); // 3 seconds * 30 fps
    });

    it('should have correct transition frames', () => {
      expect(MOVIE_CONFIG.transitionFrames).toBe(15); // 0.5 seconds * 30 fps
    });

    it('should have correct output dimensions (9:16 vertical)', () => {
      expect(MOVIE_CONFIG.outputWidth).toBe(1080);
      expect(MOVIE_CONFIG.outputHeight).toBe(1920);
      expect(MOVIE_CONFIG.outputWidth / MOVIE_CONFIG.outputHeight).toBeCloseTo(9 / 16, 2);
    });
  });
});
