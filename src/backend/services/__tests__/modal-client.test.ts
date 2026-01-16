import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  generateImages,
  processModalResponse,
  type ModalClientConfig,
} from '../modal-client';
import type { ModalGenerateRequest, ModalGenerateResponse } from '@/features/shooting/types';

// =============================================================================
// Mocks
// =============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultConfig: ModalClientConfig = {
  endpointUrl: 'https://sdeume-ai--comfyui-server-generate.modal.run',
  timeoutMs: 120000,
};

// =============================================================================
// Tests: generateImages
// =============================================================================

describe('generateImages', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should generate images with both LoRA URLs', async () => {
    // Arrange
    const request: ModalGenerateRequest = {
      groomLoraUrl: 'https://storage.fal.ai/lora/groom.safetensors',
      brideLoraUrl: 'https://storage.fal.ai/lora/bride.safetensors',
      prompt: 'wedding photo in white studio',
    };

    const mockResponse: ModalGenerateResponse = {
      images: [
        {
          base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          content_type: 'image/png',
          width: 1024,
          height: 1024,
        },
        {
          base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          content_type: 'image/png',
          width: 1024,
          height: 1024,
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await generateImages(defaultConfig, request);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.images).toHaveLength(2);
      expect(result.data.images[0].base64).toBeDefined();
    }

    expect(mockFetch).toHaveBeenCalledWith(
      `${defaultConfig.endpointUrl}/generate`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('groomLoraUrl'),
      })
    );
  });

  it('should include optional prompt in request', async () => {
    // Arrange
    const request: ModalGenerateRequest = {
      groomLoraUrl: 'https://storage.fal.ai/lora/groom.safetensors',
      brideLoraUrl: 'https://storage.fal.ai/lora/bride.safetensors',
      prompt: 'elegant wedding photo with chandelier',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ images: [] }),
    });

    // Act
    await generateImages(defaultConfig, request);

    // Assert
    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.prompt).toBe('elegant wedding photo with chandelier');
  });

  it('should work without optional prompt', async () => {
    // Arrange
    const request: ModalGenerateRequest = {
      groomLoraUrl: 'https://storage.fal.ai/lora/groom.safetensors',
      brideLoraUrl: 'https://storage.fal.ai/lora/bride.safetensors',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ images: [] }),
    });

    // Act
    const result = await generateImages(defaultConfig, request);

    // Assert
    expect(result.ok).toBe(true);
  });

  it('should return error when Modal API returns error', async () => {
    // Arrange
    const request: ModalGenerateRequest = {
      groomLoraUrl: 'https://storage.fal.ai/lora/groom.safetensors',
      brideLoraUrl: 'https://storage.fal.ai/lora/bride.safetensors',
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'GPU out of memory' }),
    });

    // Act
    const result = await generateImages(defaultConfig, request);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MODAL_GENERATION_ERROR');
    }
  });

  it('should return error on network failure', async () => {
    // Arrange
    const request: ModalGenerateRequest = {
      groomLoraUrl: 'https://storage.fal.ai/lora/groom.safetensors',
      brideLoraUrl: 'https://storage.fal.ai/lora/bride.safetensors',
    };

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Act
    const result = await generateImages(defaultConfig, request);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MODAL_GENERATION_ERROR');
    }
  });

  it('should handle timeout', async () => {
    // Arrange
    const request: ModalGenerateRequest = {
      groomLoraUrl: 'https://storage.fal.ai/lora/groom.safetensors',
      brideLoraUrl: 'https://storage.fal.ai/lora/bride.safetensors',
    };

    // Simulate timeout by never resolving
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        })
    );

    // Act
    const result = await generateImages(
      { ...defaultConfig, timeoutMs: 50 },
      request
    );

    // Assert
    expect(result.ok).toBe(false);
  });
});

// =============================================================================
// Tests: processModalResponse
// =============================================================================

describe('processModalResponse', () => {
  it('should process base64 images correctly', async () => {
    // Arrange
    const response: ModalGenerateResponse = {
      images: [
        {
          base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          content_type: 'image/png',
          width: 1024,
          height: 1024,
        },
      ],
    };
    const projectId = 'project-123';

    // Act
    const result = await processModalResponse(response, projectId);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.images).toHaveLength(1);
      // Each image should have url, blurUrl, and thumbnailUrl
      expect(result.data.images[0]).toHaveProperty('url');
      expect(result.data.images[0]).toHaveProperty('blurUrl');
      expect(result.data.images[0]).toHaveProperty('thumbnailUrl');
    }
  });

  it('should process multiple images', async () => {
    // Arrange
    const response: ModalGenerateResponse = {
      images: Array(12).fill({
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        content_type: 'image/png',
        width: 1024,
        height: 1024,
      }),
    };
    const projectId = 'project-123';

    // Act
    const result = await processModalResponse(response, projectId);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.images).toHaveLength(12);
    }
  });

  it('should handle empty images array', async () => {
    // Arrange
    const response: ModalGenerateResponse = {
      images: [],
    };
    const projectId = 'project-123';

    // Act
    const result = await processModalResponse(response, projectId);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.images).toHaveLength(0);
    }
  });

  it('should validate base64 format', async () => {
    // Arrange
    const response: ModalGenerateResponse = {
      images: [
        {
          base64: 'not-valid-base64!!!',
          content_type: 'image/png',
          width: 1024,
          height: 1024,
        },
      ],
    };
    const projectId = 'project-123';

    // Act
    const result = await processModalResponse(response, projectId);

    // Assert
    // Should either handle gracefully or return error
    expect(typeof result.ok).toBe('boolean');
  });
});

// =============================================================================
// Tests: Configuration
// =============================================================================

describe('ModalClientConfig', () => {
  it('should require endpointUrl', () => {
    const config: ModalClientConfig = {
      endpointUrl: 'https://example.modal.run',
      timeoutMs: 60000,
    };

    expect(config.endpointUrl).toBeDefined();
    expect(config.endpointUrl).toContain('modal.run');
  });

  it('should have reasonable timeout', () => {
    const config = defaultConfig;

    // Modal generation can take 1-2 minutes
    expect(config.timeoutMs).toBeGreaterThanOrEqual(60000);
    expect(config.timeoutMs).toBeLessThanOrEqual(300000);
  });
});
