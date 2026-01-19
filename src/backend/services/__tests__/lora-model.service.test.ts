import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createLoraModel,
  getLoraModelByFalJobId,
  updateLoraModelStatus,
  getLoraModelById,
  getLoraModelsByProjectId,
} from '../lora-model.service';
import type { FaceRole } from '@/features/face/types';

// =============================================================================
// Test Setup
// =============================================================================

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const createMockSupabase = () => {
  const mockChain = {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    eq: mockEq,
    single: mockSingle,
  };

  mockInsert.mockReturnValue(mockChain);
  mockSelect.mockReturnValue(mockChain);
  mockUpdate.mockReturnValue(mockChain);
  mockEq.mockReturnValue(mockChain);

  return {
    from: vi.fn(() => mockChain),
  } as unknown as SupabaseClient;
};

// =============================================================================
// Tests
// =============================================================================

describe('LoraModelService', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
  });

  describe('createLoraModel', () => {
    it('should create a new lora model with pending status', async () => {
      const mockLoraModel = {
        id: 'lora-123',
        project_id: 'project-123',
        user_id: 'user-123',
        role: 'groom',
        fal_job_id: 'fal-job-123',
        model_url: null,
        status: 'pending',
        started_at: null,
        completed_at: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockLoraModel,
        error: null,
      });

      const result = await createLoraModel(
        mockSupabase,
        'project-123',
        'user-123',
        'groom' as FaceRole,
        'fal-job-123'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toBe('lora-123');
        expect(result.data.projectId).toBe('project-123');
        expect(result.data.userId).toBe('user-123');
        expect(result.data.role).toBe('groom');
        expect(result.data.falJobId).toBe('fal-job-123');
        expect(result.data.status).toBe('pending');
        expect(result.data.modelUrl).toBeNull();
      }

      expect(mockInsert).toHaveBeenCalledWith({
        project_id: 'project-123',
        user_id: 'user-123',
        role: 'groom',
        fal_job_id: 'fal-job-123',
        status: 'pending',
      });
    });

    it('should create a lora model with training status when specified', async () => {
      const mockLoraModel = {
        id: 'lora-456',
        project_id: 'project-123',
        user_id: 'user-123',
        role: 'bride',
        fal_job_id: 'fal-job-456',
        model_url: null,
        status: 'training',
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockLoraModel,
        error: null,
      });

      const result = await createLoraModel(
        mockSupabase,
        'project-123',
        'user-123',
        'bride' as FaceRole,
        'fal-job-456',
        'training'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('training');
      }
    });

    it('should return failure when database insert fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Database error' },
      });

      const result = await createLoraModel(
        mockSupabase,
        'project-123',
        'user-123',
        'groom' as FaceRole,
        'fal-job-123'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('LORA_MODEL_CREATE_ERROR');
      }
    });
  });

  describe('getLoraModelByFalJobId', () => {
    it('should find a lora model by fal job ID', async () => {
      const mockLoraModel = {
        id: 'lora-123',
        project_id: 'project-123',
        user_id: 'user-123',
        role: 'groom',
        fal_job_id: 'fal-job-123',
        model_url: null,
        status: 'training',
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockLoraModel,
        error: null,
      });

      const result = await getLoraModelByFalJobId(mockSupabase, 'fal-job-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).not.toBeNull();
        expect(result.data?.id).toBe('lora-123');
        expect(result.data?.falJobId).toBe('fal-job-123');
      }

      expect(mockEq).toHaveBeenCalledWith('fal_job_id', 'fal-job-123');
    });

    it('should return null when lora model not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getLoraModelByFalJobId(mockSupabase, 'unknown-job-id');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeNull();
      }
    });

    it('should return failure on database error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Database error' },
      });

      const result = await getLoraModelByFalJobId(mockSupabase, 'fal-job-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('LORA_MODEL_FETCH_ERROR');
      }
    });
  });

  describe('updateLoraModelStatus', () => {
    it('should update status to completed with model URL', async () => {
      const mockUpdatedLoraModel = {
        id: 'lora-123',
        project_id: 'project-123',
        user_id: 'user-123',
        role: 'groom',
        fal_job_id: 'fal-job-123',
        model_url: 'https://fal.ai/lora/model.safetensors',
        status: 'completed',
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:30:00Z',
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedLoraModel,
            error: null,
          }),
        }),
      });

      const result = await updateLoraModelStatus(
        mockSupabase,
        'lora-123',
        'completed',
        'https://fal.ai/lora/model.safetensors'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('completed');
        expect(result.data.modelUrl).toBe('https://fal.ai/lora/model.safetensors');
        expect(result.data.completedAt).not.toBeNull();
      }
    });

    it('should update status to training without model URL', async () => {
      const mockUpdatedLoraModel = {
        id: 'lora-123',
        project_id: 'project-123',
        user_id: 'user-123',
        role: 'groom',
        fal_job_id: 'fal-job-123',
        model_url: null,
        status: 'training',
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedLoraModel,
            error: null,
          }),
        }),
      });

      const result = await updateLoraModelStatus(
        mockSupabase,
        'lora-123',
        'training'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('training');
        expect(result.data.modelUrl).toBeNull();
      }
    });

    it('should update status to failed with error message', async () => {
      const mockUpdatedLoraModel = {
        id: 'lora-123',
        project_id: 'project-123',
        user_id: 'user-123',
        role: 'groom',
        fal_job_id: 'fal-job-123',
        model_url: null,
        status: 'failed',
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        error_message: 'Training failed: GPU error',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedLoraModel,
            error: null,
          }),
        }),
      });

      const result = await updateLoraModelStatus(
        mockSupabase,
        'lora-123',
        'failed',
        undefined,
        'Training failed: GPU error'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe('failed');
        expect(result.data.errorMessage).toBe('Training failed: GPU error');
      }
    });

    it('should return failure when update fails', async () => {
      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'INTERNAL_ERROR', message: 'Update failed' },
          }),
        }),
      });

      const result = await updateLoraModelStatus(
        mockSupabase,
        'lora-123',
        'completed',
        'https://fal.ai/lora/model.safetensors'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('LORA_MODEL_UPDATE_ERROR');
      }
    });

    it('should return failure when lora model not found', async () => {
      mockEq.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      });

      const result = await updateLoraModelStatus(
        mockSupabase,
        'nonexistent-id',
        'completed',
        'https://fal.ai/lora/model.safetensors'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('LORA_MODEL_NOT_FOUND');
      }
    });
  });

  describe('getLoraModelById', () => {
    it('should find a lora model by ID', async () => {
      const mockLoraModel = {
        id: 'lora-123',
        project_id: 'project-123',
        user_id: 'user-123',
        role: 'groom',
        fal_job_id: 'fal-job-123',
        model_url: 'https://fal.ai/lora/model.safetensors',
        status: 'completed',
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:30:00Z',
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockLoraModel,
        error: null,
      });

      const result = await getLoraModelById(mockSupabase, 'lora-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).not.toBeNull();
        expect(result.data?.id).toBe('lora-123');
      }
    });

    it('should return null when lora model not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getLoraModelById(mockSupabase, 'unknown-id');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('getLoraModelsByProjectId', () => {
    it('should find all lora models for a project', async () => {
      const mockLoraModels = [
        {
          id: 'lora-groom',
          project_id: 'project-123',
          user_id: 'user-123',
          role: 'groom',
          fal_job_id: 'fal-job-groom',
          model_url: 'https://fal.ai/lora/groom.safetensors',
          status: 'completed',
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:30:00Z',
          error_message: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'lora-bride',
          project_id: 'project-123',
          user_id: 'user-123',
          role: 'bride',
          fal_job_id: 'fal-job-bride',
          model_url: 'https://fal.ai/lora/bride.safetensors',
          status: 'completed',
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:30:00Z',
          error_message: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockEq.mockReturnValue({
        data: mockLoraModels,
        error: null,
      });

      const result = await getLoraModelsByProjectId(mockSupabase, 'project-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(2);
        expect(result.data[0].role).toBe('groom');
        expect(result.data[1].role).toBe('bride');
      }
    });

    it('should return empty array when no models found', async () => {
      mockEq.mockReturnValue({
        data: [],
        error: null,
      });

      const result = await getLoraModelsByProjectId(mockSupabase, 'project-without-lora');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(0);
      }
    });

    it('should return failure on database error', async () => {
      mockEq.mockReturnValue({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Database error' },
      });

      const result = await getLoraModelsByProjectId(mockSupabase, 'project-123');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('LORA_MODEL_FETCH_ERROR');
      }
    });
  });
});
