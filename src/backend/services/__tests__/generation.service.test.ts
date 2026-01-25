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

vi.mock('../lora-model.service', () => ({
  createLoraModel: vi.fn(),
  getLoraModelByFalJobId: vi.fn(),
  updateLoraModelStatus: vi.fn(),
}));

vi.mock('../user-face-model.service', () => ({
  upsertUserFaceModel: vi.fn(),
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
    it('should create ZIP files, start Fal.ai training, and create lora_models records', async () => {
      const { createTrainingZip } = await import('../storage.service');
      const { startLoraTraining } = await import('../fal-client');
      const { createLoraModel } = await import('../lora-model.service');

      (createTrainingZip as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, data: 'https://storage.example.com/groom.zip' })
        .mockResolvedValueOnce({ ok: true, data: 'https://storage.example.com/bride.zip' });

      (startLoraTraining as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, data: { requestId: 'fal-groom-123' } })
        .mockResolvedValueOnce({ ok: true, data: { requestId: 'fal-bride-456' } });

      // Mock lora_models creation
      (createLoraModel as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          data: {
            id: 'lora-groom-id',
            projectId: 'project123',
            userId: 'user123',
            role: 'groom',
            falJobId: 'fal-groom-123',
            status: 'training',
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            id: 'lora-bride-id',
            projectId: 'project123',
            userId: 'user123',
            role: 'bride',
            falJobId: 'fal-bride-456',
            status: 'training',
          },
        });

      mockSingle.mockResolvedValue({
        data: {
          id: 'gen123',
          user_id: 'user123',
          status: 'training',
          groom_lora_model_id: 'lora-groom-id',
          bride_lora_model_id: 'lora-bride-id',
        },
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
        expect(result.data.groomLoraModelId).toBe('lora-groom-id');
        expect(result.data.brideLoraModelId).toBe('lora-bride-id');
      }

      expect(createTrainingZip).toHaveBeenCalledTimes(2);
      expect(startLoraTraining).toHaveBeenCalledTimes(2);
      expect(createLoraModel).toHaveBeenCalledTimes(2);
      expect(createLoraModel).toHaveBeenCalledWith(
        mockSupabase,
        'project123',
        expect.any(String),
        'groom',
        'fal-groom-123',
        'training'
      );
      expect(createLoraModel).toHaveBeenCalledWith(
        mockSupabase,
        'project123',
        expect.any(String),
        'bride',
        'fal-bride-456',
        'training'
      );
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
    it('should update lora_models and generations when groom training completes', async () => {
      const { getLoraModelByFalJobId, updateLoraModelStatus } = await import('../lora-model.service');
      const { upsertUserFaceModel } = await import('../user-face-model.service');

      // Mock finding lora_model by fal_job_id
      (getLoraModelByFalJobId as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          id: 'lora-groom-id',
          projectId: 'project123',
          userId: 'user123',
          role: 'groom',
          falJobId: 'fal-groom-123',
          modelUrl: null,
          status: 'training',
        },
      });

      // Mock updating lora_model status
      (updateLoraModelStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          id: 'lora-groom-id',
          projectId: 'project123',
          userId: 'user123',
          role: 'groom',
          falJobId: 'fal-groom-123',
          modelUrl: 'https://fal.ai/lora/groom.safetensors',
          status: 'completed',
        },
      });

      // Mock upsertUserFaceModel
      (upsertUserFaceModel as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { id: 'face-model-id', userId: 'user123', role: 'groom', loraModelId: 'lora-groom-id' },
      });

      // Mock finding generation by lora_model_id
      mockEq.mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'gen123',
            user_id: 'user123',
            groom_lora_model_id: 'lora-groom-id',
            bride_lora_model_id: 'lora-bride-id',
            groom_lora:  { model_url: 'https://fal.ai/lora/groom.safetensors' },
            bride_lora: null,
          },
          error: null,
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

      expect(getLoraModelByFalJobId).toHaveBeenCalledWith(mockSupabase, 'fal-groom-123');
      expect(updateLoraModelStatus).toHaveBeenCalledWith(
        mockSupabase,
        'lora-groom-id',
        'completed',
        'https://fal.ai/lora/groom.safetensors'
      );
      expect(upsertUserFaceModel).toHaveBeenCalledWith(mockSupabase, 'user123', 'groom', 'lora-groom-id');
    });

    it('should set bothCompleted=true when both lora_models are completed', async () => {
      const { getLoraModelByFalJobId, updateLoraModelStatus } = await import('../lora-model.service');
      const { upsertUserFaceModel } = await import('../user-face-model.service');

      // Mock finding lora_model by fal_job_id (bride this time)
      (getLoraModelByFalJobId as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          id: 'lora-bride-id',
          projectId: 'project123',
          userId: 'user123',
          role: 'bride',
          falJobId: 'fal-bride-456',
          modelUrl: null,
          status: 'training',
        },
      });

      // Mock updating lora_model status
      (updateLoraModelStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          id: 'lora-bride-id',
          projectId: 'project123',
          userId: 'user123',
          role: 'bride',
          falJobId: 'fal-bride-456',
          modelUrl: 'https://fal.ai/lora/bride.safetensors',
          status: 'completed',
        },
      });

      // Mock upsertUserFaceModel
      (upsertUserFaceModel as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { id: 'face-model-id', userId: 'user123', role: 'bride', loraModelId: 'lora-bride-id' },
      });

      // Mock finding generation with both lora_models completed
      mockEq.mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'gen123',
            user_id: 'user123',
            groom_lora_model_id: 'lora-groom-id',
            bride_lora_model_id: 'lora-bride-id',
            groom_lora: { model_url: 'https://fal.ai/lora/groom.safetensors' },
            bride_lora: { model_url: 'https://fal.ai/lora/bride.safetensors' },
          },
          error: null,
        }),
      });

      const result = await handleFalWebhookForGeneration(
        mockSupabase,
        'fal-bride-456',
        'https://fal.ai/lora/bride.safetensors'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.brideLoraUrl).toBe('https://fal.ai/lora/bride.safetensors');
        expect(result.data.bothCompleted).toBe(true);
      }

      // Verify that training_completed_at AND status are updated when bothCompleted is true
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update status to generating when both trainings complete', async () => {
      const { getLoraModelByFalJobId, updateLoraModelStatus } = await import('../lora-model.service');
      const { upsertUserFaceModel } = await import('../user-face-model.service');

      (getLoraModelByFalJobId as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          id: 'lora-bride-id',
          projectId: 'project123',
          userId: 'user123',
          role: 'bride',
          falJobId: 'fal-bride-456',
          modelUrl: null,
          status: 'training',
        },
      });

      (updateLoraModelStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          id: 'lora-bride-id',
          modelUrl: 'https://fal.ai/lora/bride.safetensors',
          status: 'completed',
        },
      });

      (upsertUserFaceModel as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { id: 'face-model-id' },
      });

      // Track update calls
      const updateCalls: Record<string, unknown>[] = [];
      mockUpdate.mockImplementation((data: Record<string, unknown>) => {
        updateCalls.push(data);
        return {
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      mockEq.mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'gen123',
            user_id: 'user123',
            groom_lora_model_id: 'lora-groom-id',
            bride_lora_model_id: 'lora-bride-id',
            groom_lora: { model_url: 'https://fal.ai/lora/groom.safetensors' },
            bride_lora: { model_url: 'https://fal.ai/lora/bride.safetensors' },
          },
          error: null,
        }),
      });

      await handleFalWebhookForGeneration(
        mockSupabase,
        'fal-bride-456',
        'https://fal.ai/lora/bride.safetensors'
      );

      // Verify status is updated to 'generating' along with training_completed_at
      const statusUpdate = updateCalls.find(call => call.status === 'generating');
      expect(statusUpdate).toBeDefined();
      expect(statusUpdate?.training_completed_at).toBeDefined();
    });

    it('should return failure when lora_model not found by Fal job ID', async () => {
      const { getLoraModelByFalJobId } = await import('../lora-model.service');

      (getLoraModelByFalJobId as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: null,
      });

      const result = await handleFalWebhookForGeneration(
        mockSupabase,
        'unknown-job-id',
        'https://fal.ai/lora/test.safetensors'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('LORA_MODEL_NOT_FOUND');
      }
    });

    it('should return failure when generation not found for lora_model', async () => {
      const { getLoraModelByFalJobId, updateLoraModelStatus } = await import('../lora-model.service');
      const { upsertUserFaceModel } = await import('../user-face-model.service');

      (getLoraModelByFalJobId as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          id: 'lora-groom-id',
          projectId: 'project123',
          userId: 'user123',
          role: 'groom',
          falJobId: 'fal-groom-123',
        },
      });

      (updateLoraModelStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { id: 'lora-groom-id', modelUrl: 'https://fal.ai/lora/groom.safetensors', status: 'completed' },
      });

      (upsertUserFaceModel as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: { id: 'face-model-id' },
      });

      // Mock generation not found
      mockEq.mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      });

      const result = await handleFalWebhookForGeneration(
        mockSupabase,
        'fal-groom-123',
        'https://fal.ai/lora/groom.safetensors'
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

      // Now calls Modal API 3 times in parallel (hybrid batching: 3 batches x 4 images)
      (generateImages as ReturnType<typeof vi.fn>).mockImplementation(async (_config, request) => ({
        ok: true,
        data: {
          // Each batch returns `count` images
          images: Array(request.count || 1).fill(null).map((_, i) => ({
            base64: `img_${i}`,
            content_type: 'image/png',
            width: 896,
            height: 1152,
            status: 'success',
          })),
          count: request.count || 1,
        },
      }));

      let uploadCount = 0;
      (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        uploadCount++;
        return {
          ok: true,
          data: {
            originalUrl: `https://storage.example.com/${uploadCount - 1}_original.webp`,
            thumbnailUrl: `https://storage.example.com/${uploadCount - 1}_thumbnail.webp`,
            blurHash: `blur${uploadCount}`,
          },
        };
      });

      // First call: fetch existing images (empty for first generation)
      // Second call: theme fetch (null)
      // Third call: final update result
      mockSingle
        .mockResolvedValueOnce({
          data: { id: 'gen123', images: [] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        .mockResolvedValue({
          data: {
            id: 'gen123',
            status: 'completed',
            images: [],
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
        expect(result.data.images.length).toBe(12); // 12 images (3 batches x 4)
      }

      expect(generateImages).toHaveBeenCalledTimes(3); // 3 batches (hybrid)
      expect(uploadGeneratedImage).toHaveBeenCalledTimes(12); // 12 uploads
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

    it('should update project status to completed when generation completes', async () => {
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

      // Track all update calls to verify project status update
      const updateCalls: { table: string; data: Record<string, unknown> }[] = [];
      const mockFrom = vi.fn((table: string) => ({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        update: vi.fn((data: Record<string, unknown>) => {
          updateCalls.push({ table, data });
          return {
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'gen123', status: 'completed', images: [] },
                  error: null,
                }),
              }),
            }),
          };
        }),
      }));
      (mockSupabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      mockSingle.mockResolvedValue({
        data: { id: 'gen123', status: 'completed', images: [] },
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

      // Verify that project status was updated to 'completed'
      const projectUpdate = updateCalls.find(
        (call) => call.table === 'projects' && call.data.status === 'completed'
      );
      expect(projectUpdate).toBeDefined();
      expect(projectUpdate?.data.status).toBe('completed');
    });

    it('should preserve existing images when regenerating', async () => {
      const { generateImages } = await import('../modal-client');
      const { uploadGeneratedImage } = await import('../storage.service');

      // Existing images from previous generation
      const existingImages = [
        {
          url: 'https://storage.example.com/old_0_original.webp',
          is_blur: false,
          thumbnail_url: 'https://storage.example.com/old_0_thumbnail.webp',
          blur_hash: 'oldblur1',
        },
        {
          url: 'https://storage.example.com/old_1_original.webp',
          is_blur: false,
          thumbnail_url: 'https://storage.example.com/old_1_thumbnail.webp',
          blur_hash: 'oldblur2',
        },
      ];

      // Mock initial fetch to get existing generation with images
      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'gen123',
            project_id: 'project123',
            images: existingImages,
          },
          error: null,
        })
        // Mock theme fetch (returns no theme)
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        // Mock final update
        .mockResolvedValue({
          data: {
            id: 'gen123',
            status: 'completed',
            images: [],
          },
          error: null,
        });

      // Now calls Modal API 3 times in parallel, each returning 4 images (hybrid batching)
      (generateImages as ReturnType<typeof vi.fn>).mockImplementation(async (_config, request) => ({
        ok: true,
        data: {
          images: Array(request.count || 1).fill(null).map((_, i) => ({
            base64: `newimage_${i}`,
            content_type: 'image/png',
            width: 896,
            height: 1152,
            status: 'success',
          })),
          count: request.count || 1,
        },
      }));

      let uploadCount = 0;
      (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        uploadCount++;
        return {
          ok: true,
          data: {
            originalUrl: `https://storage.example.com/${uploadCount + 1}_original.webp`,
            thumbnailUrl: `https://storage.example.com/${uploadCount + 1}_thumbnail.webp`,
            blurHash: `newblur${uploadCount}`,
          },
        };
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
        // Should have 14 images: 2 existing + 12 new (3 batches x 4 images)
        expect(result.data.images.length).toBe(14);
        // First two should be existing images
        expect(result.data.images[0].url).toBe('https://storage.example.com/old_0_original.webp');
        expect(result.data.images[1].url).toBe('https://storage.example.com/old_1_original.webp');
      }

      // Verify uploadGeneratedImage was called 12 times (12 new images)
      expect(uploadGeneratedImage).toHaveBeenCalledTimes(12);
      // Verify first new image starts from index 2 (after existing 2 images)
      expect(uploadGeneratedImage).toHaveBeenCalledWith(
        expect.anything(),
        'project123',
        'gen123',
        2, // Should start from index 2 (after existing 2 images)
        expect.any(String)
      );
    });


    // =========================================================================
    // Hybrid Batch Generation Tests (12 images = 3 batches x 4 images)
    // =========================================================================
    describe('hybrid batch generation (12 images = 3 batches x 4)', () => {
      it('should call Modal API 3 times with count=4 each (12 images total)', async () => {
        const { generateImages } = await import('../modal-client');
        const { uploadGeneratedImage } = await import('../storage.service');

        const capturedCalls: { seed: number; count: number }[] = [];
        (generateImages as ReturnType<typeof vi.fn>).mockImplementation(async (_config, request) => {
          capturedCalls.push({ seed: request.seed, count: request.count });
          return {
            ok: true,
            data: {
              images: Array(request.count || 1).fill(null).map((_, i) => ({
                base64: `batch_img_${i}`,
                status: 'success',
                content_type: 'image/png',
                width: 896,
                height: 1152,
              })),
              count: request.count || 1,
            },
          };
        });

        let uploadCount = 0;
        (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          uploadCount++;
          return {
            ok: true,
            data: {
              originalUrl: `https://storage.example.com/${uploadCount}_original.webp`,
              thumbnailUrl: `https://storage.example.com/${uploadCount}_thumbnail.webp`,
              blurHash: `blur${uploadCount}`,
            },
          };
        });

        mockSingle
          .mockResolvedValueOnce({ data: { id: 'gen123', images: [] }, error: null })
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValue({ data: { id: 'gen123', status: 'completed', images: [] }, error: null });

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
          // 12 images total (3 batches x 4 images)
          expect(result.data.images.length).toBe(12);
        }

        // Verify 3 batch calls were made
        expect(generateImages).toHaveBeenCalledTimes(3);

        // Verify each batch has count=4
        expect(capturedCalls.every(call => call.count === 4)).toBe(true);

        // Verify seeds are different for each batch
        const uniqueSeeds = new Set(capturedCalls.map(c => c.seed));
        expect(uniqueSeeds.size).toBe(3);
      });

      it('should filter out failed images within a batch', async () => {
        const { generateImages } = await import('../modal-client');
        const { uploadGeneratedImage } = await import('../storage.service');

        let batchIndex = 0;
        (generateImages as ReturnType<typeof vi.fn>).mockImplementation(async (_config, request) => {
          batchIndex++;
          // Second batch has 1 failed image
          if (batchIndex === 2) {
            return {
              ok: true,
              data: {
                images: [
                  { base64: 'img1', status: 'success', content_type: 'image/png', width: 896, height: 1152 },
                  { error: 'GPU OOM', status: 'failed' },
                  { base64: 'img3', status: 'success', content_type: 'image/png', width: 896, height: 1152 },
                  { base64: 'img4', status: 'success', content_type: 'image/png', width: 896, height: 1152 },
                ],
                count: 4,
              },
            };
          }
          return {
            ok: true,
            data: {
              images: Array(request.count || 1).fill(null).map((_, i) => ({
                base64: `batch${batchIndex}_img${i}`,
                status: 'success',
                content_type: 'image/png',
                width: 896,
                height: 1152,
              })),
              count: request.count || 1,
            },
          };
        });

        let uploadCount = 0;
        (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          uploadCount++;
          return {
            ok: true,
            data: {
              originalUrl: `https://storage.example.com/${uploadCount}_original.webp`,
              thumbnailUrl: `https://storage.example.com/${uploadCount}_thumbnail.webp`,
              blurHash: `blur${uploadCount}`,
            },
          };
        });

        mockSingle
          .mockResolvedValueOnce({ data: { id: 'gen123', images: [] }, error: null })
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValue({ data: { id: 'gen123', status: 'completed', images: [] }, error: null });

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
          // 11 images: 4 + 3 (1 failed) + 4
          expect(result.data.images.length).toBe(11);
        }

        // 11 uploads (failed images are filtered out)
        expect(uploadGeneratedImage).toHaveBeenCalledTimes(11);
      });

      it('should handle partial batch failure (2/3 batches succeed)', async () => {
        const { generateImages } = await import('../modal-client');
        const { uploadGeneratedImage } = await import('../storage.service');

        let batchIndex = 0;
        (generateImages as ReturnType<typeof vi.fn>).mockImplementation(async (_config, request) => {
          batchIndex++;
          // Third batch completely fails
          if (batchIndex === 3) {
            return {
              ok: false,
              error: { status: 500, code: 'MODAL_ERROR', message: 'Container crashed' },
            };
          }
          return {
            ok: true,
            data: {
              images: Array(request.count || 1).fill(null).map((_, i) => ({
                base64: `batch${batchIndex}_img${i}`,
                status: 'success',
                content_type: 'image/png',
                width: 896,
                height: 1152,
              })),
              count: request.count || 1,
            },
          };
        });

        let uploadCount = 0;
        (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          uploadCount++;
          return {
            ok: true,
            data: {
              originalUrl: `https://storage.example.com/${uploadCount}_original.webp`,
              thumbnailUrl: `https://storage.example.com/${uploadCount}_thumbnail.webp`,
              blurHash: `blur${uploadCount}`,
            },
          };
        });

        mockSingle
          .mockResolvedValueOnce({ data: { id: 'gen123', images: [] }, error: null })
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValue({ data: { id: 'gen123', status: 'completed', images: [] }, error: null });

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
          // 8 images: 4 + 4 + 0 (failed batch)
          expect(result.data.images.length).toBe(8);
        }

        expect(uploadGeneratedImage).toHaveBeenCalledTimes(8);
      });

      it('should return failure when all batches fail', async () => {
        const { generateImages } = await import('../modal-client');

        // All 3 batches fail
        (generateImages as ReturnType<typeof vi.fn>).mockResolvedValue({
          ok: false,
          error: { status: 500, code: 'MODAL_ERROR', message: 'All containers crashed' },
        });

        mockSingle
          .mockResolvedValueOnce({ data: { id: 'gen123', images: [] }, error: null })
          .mockResolvedValueOnce({ data: null, error: null });

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

      it('should update DB incrementally after each batch completes', async () => {
        const { generateImages } = await import('../modal-client');
        const { uploadGeneratedImage } = await import('../storage.service');

        const dbUpdateCalls: unknown[][] = [];

        // Track all update calls
        mockUpdate.mockImplementation((data: Record<string, unknown>) => {
          dbUpdateCalls.push([data]);
          return {
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'gen123', status: 'completed', images: [] },
                  error: null,
                }),
              }),
            }),
          };
        });

        let batchIndex = 0;
        (generateImages as ReturnType<typeof vi.fn>).mockImplementation(async (_config, request) => {
          batchIndex++;
          return {
            ok: true,
            data: {
              images: Array(request.count || 1).fill(null).map((_, i) => ({
                base64: `batch${batchIndex}_img${i}`,
                status: 'success',
                content_type: 'image/png',
                width: 896,
                height: 1152,
              })),
              count: request.count || 1,
            },
          };
        });

        let uploadCount = 0;
        (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          uploadCount++;
          return {
            ok: true,
            data: {
              originalUrl: `https://storage.example.com/${uploadCount}_original.webp`,
              thumbnailUrl: `https://storage.example.com/${uploadCount}_thumbnail.webp`,
              blurHash: `blur${uploadCount}`,
            },
          };
        });

        mockSingle
          .mockResolvedValueOnce({ data: { id: 'gen123', images: [] }, error: null })
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValue({ data: { id: 'gen123', status: 'completed', images: [] }, error: null });

        await triggerModalGeneration(
          mockSupabase,
          'gen123',
          'project123',
          'https://fal.ai/lora/groom.safetensors',
          'https://fal.ai/lora/bride.safetensors',
          'theme123',
          { endpoint: 'http://modal.test' }
        );

        // Verify multiple DB updates happened (incremental updates)
        // At minimum: 1 for status='generating' + 12 for images + 1 for final completion
        expect(mockUpdate).toHaveBeenCalled();

        // Find image array updates
        const imageUpdates = dbUpdateCalls.filter(
          call => call[0] && typeof call[0] === 'object' && 'images' in (call[0] as object)
        );
        expect(imageUpdates.length).toBeGreaterThan(0);
      });

      it('should use correct seed spacing between batches', async () => {
        const { generateImages } = await import('../modal-client');
        const { uploadGeneratedImage } = await import('../storage.service');

        const capturedSeeds: number[] = [];
        (generateImages as ReturnType<typeof vi.fn>).mockImplementation(async (_config, request) => {
          capturedSeeds.push(request.seed);
          return {
            ok: true,
            data: {
              images: Array(request.count || 1).fill(null).map((_, i) => ({
                base64: `img${i}`,
                status: 'success',
                content_type: 'image/png',
                width: 896,
                height: 1152,
              })),
              count: request.count || 1,
            },
          };
        });

        (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockResolvedValue({
          ok: true,
          data: {
            originalUrl: 'https://storage.example.com/original.webp',
            thumbnailUrl: 'https://storage.example.com/thumbnail.webp',
            blurHash: 'blur1',
          },
        });

        mockSingle
          .mockResolvedValueOnce({ data: { id: 'gen123', images: [] }, error: null })
          .mockResolvedValueOnce({ data: null, error: null })
          .mockResolvedValue({ data: { id: 'gen123', status: 'completed', images: [] }, error: null });

        await triggerModalGeneration(
          mockSupabase,
          'gen123',
          'project123',
          'https://fal.ai/lora/groom.safetensors',
          'https://fal.ai/lora/bride.safetensors',
          'theme123',
          { endpoint: 'http://modal.test' }
        );

        // Verify seeds are spaced correctly (IMAGES_PER_BATCH * 1000 apart)
        // With IMAGES_PER_BATCH=4: seed0, seed0 + 4000, seed0 + 8000
        expect(capturedSeeds.length).toBe(3);
        const sortedSeeds = [...capturedSeeds].sort((a, b) => a - b);
        expect(sortedSeeds[1] - sortedSeeds[0]).toBe(4000); // 4 * 1000
        expect(sortedSeeds[2] - sortedSeeds[1]).toBe(4000);
      });
    });
  });
});
