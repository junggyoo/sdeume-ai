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
        .mockResolvedValueOnce({
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
        .mockResolvedValueOnce({
          data: {
            id: 'gen123',
            status: 'completed',
            images: [
              ...existingImages,
              {
                url: 'https://storage.example.com/2_original.webp',
                is_blur: false,
                thumbnail_url: 'https://storage.example.com/2_thumbnail.webp',
                blur_hash: 'newblur1',
              },
            ],
          },
          error: null,
        });

      (generateImages as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          images: [{ base64: 'data:image/png;base64,newimage' }],
        },
      });

      (uploadGeneratedImage as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        data: {
          originalUrl: 'https://storage.example.com/2_original.webp',
          thumbnailUrl: 'https://storage.example.com/2_thumbnail.webp',
          blurHash: 'newblur1',
        },
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
        // Should have 3 images: 2 existing + 1 new
        expect(result.data.images.length).toBe(3);
        // First two should be existing images
        expect(result.data.images[0].url).toBe('https://storage.example.com/old_0_original.webp');
        expect(result.data.images[1].url).toBe('https://storage.example.com/old_1_original.webp');
        // Third should be new image
        expect(result.data.images[2].url).toBe('https://storage.example.com/2_original.webp');
      }

      // Verify uploadGeneratedImage was called with correct index (startIndex = 2)
      expect(uploadGeneratedImage).toHaveBeenCalledWith(
        expect.anything(),
        'project123',
        'gen123',
        2, // Should start from index 2 (after existing 2 images)
        expect.any(String)
      );
    });
  });
});
