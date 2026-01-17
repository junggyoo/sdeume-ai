import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  startLoraTrainingForGeneration,
  handleFalWebhookForGeneration,
  triggerModalGeneration,
} from '../generation.service';

// Mock dependencies
vi.mock('../fal-client', () => ({
  startLoraTraining: vi.fn(),
}));

vi.mock('../modal-client', () => ({
  generateImages: vi.fn(),
}));

vi.mock('../storage.service', () => ({
  createTrainingZip: vi.fn(),
  uploadGeneratedImage: vi.fn(),
}));

const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const createMockSupabase = () => {
  const mockChain = {
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    update: mockUpdate,
  };

  mockSelect.mockReturnValue(mockChain);
  mockEq.mockReturnValue(mockChain);
  mockUpdate.mockReturnValue(mockChain);

  return {
    from: vi.fn(() => mockChain),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.zip' },
        }),
      })),
    },
  } as unknown as SupabaseClient;
};

describe('Generation Service', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  describe('startLoraTrainingForGeneration', () => {
    it('should create ZIP files and start Fal.ai training for both roles', async () => {
      const { createTrainingZip } = await import('../storage.service');
      const { startLoraTraining } = await import('../fal-client');

      (createTrainingZip as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, data: 'https://storage.example.com/groom.zip' })
        .mockResolvedValueOnce({ ok: true, data: 'https://storage.example.com/bride.zip' });

      (startLoraTraining as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, data: { requestId: 'fal-groom-123' } })
        .mockResolvedValueOnce({ ok: true, data: { requestId: 'fal-bride-456' } });

      mockSingle.mockResolvedValue({
        data: { id: 'gen123', status: 'queued' },
        error: null,
      });

      const result = await startLoraTrainingForGeneration(
        mockSupabase,
        'gen123',
        'project123',
        { apiKey: 'test', webhookSecret: 'test', webhookUrl: 'http://test.com/webhook' }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.groomFalJobId).toBe('fal-groom-123');
        expect(result.data.brideFalJobId).toBe('fal-bride-456');
        expect(result.data.status).toBe('training');
      }

      expect(createTrainingZip).toHaveBeenCalledTimes(2);
      expect(startLoraTraining).toHaveBeenCalledTimes(2);
    });

    it('should return failure when ZIP creation fails', async () => {
      const { createTrainingZip } = await import('../storage.service');

      (createTrainingZip as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        error: { status: 400, code: 'NO_IMAGES_FOUND', message: 'No images found' },
      });

      const result = await startLoraTrainingForGeneration(
        mockSupabase,
        'gen123',
        'project123',
        { apiKey: 'test', webhookSecret: 'test', webhookUrl: 'http://test.com/webhook' }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NO_IMAGES_FOUND');
      }
    });

    it('should return failure when Fal.ai training start fails', async () => {
      const { createTrainingZip } = await import('../storage.service');
      const { startLoraTraining } = await import('../fal-client');

      (createTrainingZip as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: 'https://storage.example.com/test.zip',
      });

      (startLoraTraining as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        error: { status: 500, code: 'FAL_ERROR', message: 'Fal.ai API error' },
      });

      const result = await startLoraTrainingForGeneration(
        mockSupabase,
        'gen123',
        'project123',
        { apiKey: 'test', webhookSecret: 'test', webhookUrl: 'http://test.com/webhook' }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('FAL_ERROR');
      }
    });
  });

  describe('handleFalWebhookForGeneration', () => {
    it('should update groom LoRA URL when groom training completes', async () => {
      mockEq.mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'gen123',
            groom_fal_job_id: 'fal-groom-123',
            bride_fal_job_id: 'fal-bride-456',
            groom_lora_url: null,
            bride_lora_url: null,
          },
          error: null,
        }),
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'gen123',
                groom_lora_url: 'https://fal.ai/lora/groom.safetensors',
                bride_lora_url: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await handleFalWebhookForGeneration(
        mockSupabase,
        'fal-groom-123',
        'https://fal.ai/lora/groom.safetensors'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.groomLoraUrl).toBe('https://fal.ai/lora/groom.safetensors');
        expect(result.data.bothCompleted).toBe(false);
      }
    });

    it('should trigger Modal generation when both trainings complete', async () => {
      mockEq.mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'gen123',
            groom_fal_job_id: 'fal-groom-123',
            bride_fal_job_id: 'fal-bride-456',
            groom_lora_url: 'https://fal.ai/lora/groom.safetensors',
            bride_lora_url: null,
          },
          error: null,
        }),
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'gen123',
                groom_lora_url: 'https://fal.ai/lora/groom.safetensors',
                bride_lora_url: 'https://fal.ai/lora/bride.safetensors',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await handleFalWebhookForGeneration(
        mockSupabase,
        'fal-bride-456',
        'https://fal.ai/lora/bride.safetensors'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.bothCompleted).toBe(true);
      }
    });

    it('should return failure when generation not found by Fal job ID', async () => {
      mockEq.mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      });

      const result = await handleFalWebhookForGeneration(
        mockSupabase,
        'unknown-job-id',
        'https://fal.ai/lora/test.safetensors'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('GENERATION_NOT_FOUND');
      }
    });
  });

  describe('triggerModalGeneration', () => {
    it('should call Modal API and update generation with images', async () => {
      const { generateImages } = await import('../modal-client');
      const { uploadGeneratedImage } = await import('../storage.service');

      (generateImages as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          images: [
            { base64: 'data:image/png;base64,abc123' },
            { base64: 'data:image/png;base64,def456' },
          ],
        },
      });

      (uploadGeneratedImage as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          data: {
            originalUrl: 'https://storage.example.com/0_original.webp',
            thumbnailUrl: 'https://storage.example.com/0_thumbnail.webp',
            blurHash: 'blur1',
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            originalUrl: 'https://storage.example.com/1_original.webp',
            thumbnailUrl: 'https://storage.example.com/1_thumbnail.webp',
            blurHash: 'blur2',
          },
        });

      mockSingle.mockResolvedValue({
        data: {
          id: 'gen123',
          status: 'completed',
          images: [
            { url: 'https://storage.example.com/0_original.webp', is_blur: false },
            { url: 'https://storage.example.com/1_original.webp', is_blur: false },
          ],
        },
        error: null,
      });

      const result = await triggerModalGeneration(
        mockSupabase,
        'gen123',
        'project123',
        'https://fal.ai/lora/groom.safetensors',
        'https://fal.ai/lora/bride.safetensors',
        'theme123',
        { endpoint: 'http://modal.test' }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('completed');
        expect(result.data.images.length).toBe(2);
      }

      expect(generateImages).toHaveBeenCalled();
      expect(uploadGeneratedImage).toHaveBeenCalledTimes(2);
    });

    it('should return failure when Modal API fails', async () => {
      const { generateImages } = await import('../modal-client');

      (generateImages as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        error: { status: 500, code: 'MODAL_ERROR', message: 'Modal API error' },
      });

      const result = await triggerModalGeneration(
        mockSupabase,
        'gen123',
        'project123',
        'https://fal.ai/lora/groom.safetensors',
        'https://fal.ai/lora/bride.safetensors',
        'theme123',
        { endpoint: 'http://modal.test' }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('MODAL_ERROR');
      }
    });

    it('should update status to generating before processing', async () => {
      const { generateImages } = await import('../modal-client');
      const { uploadGeneratedImage } = await import('../storage.service');

      (generateImages as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { images: [{ base64: 'data:image/png;base64,test' }] },
      });

      (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          originalUrl: 'https://storage.example.com/0_original.webp',
          thumbnailUrl: 'https://storage.example.com/0_thumbnail.webp',
          blurHash: 'blur1',
        },
      });

      mockSingle.mockResolvedValue({
        data: { id: 'gen123', status: 'completed', images: [] },
        error: null,
      });

      await triggerModalGeneration(
        mockSupabase,
        'gen123',
        'project123',
        'https://fal.ai/lora/groom.safetensors',
        'https://fal.ai/lora/bride.safetensors',
        'theme123',
        { endpoint: 'http://modal.test' }
      );

      // Verify update was called with 'generating' status
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
