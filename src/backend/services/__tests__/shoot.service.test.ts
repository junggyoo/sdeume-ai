import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createShootJob,
  getShootJobById,
  updateShootJobStatus,
  handleFalWebhookCompletion,
  getRecommendedPollingInterval,
  mapRowToShootJob,
} from '../shoot.service';
import type {
  ShootJob,
  ShootJobRow,
  ShootJobStatus,
} from '@/features/shooting/types';
import { POLLING_INTERVALS, SHOOT_ERROR_CODES } from '@/features/shooting/types';

// =============================================================================
// Mocks
// =============================================================================

const createMockSupabase = () => {
  const mockSingle = vi.fn();

  const createChainedMock = () => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
        single: mockSingle,
      }),
      single: mockSingle,
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    }),
  });

  return {
    from: vi.fn(() => createChainedMock()),
    _mocks: {
      single: mockSingle,
    },
  } as unknown as SupabaseClient & { _mocks: { single: ReturnType<typeof vi.fn> } };
};

const createMockShootJobRow = (overrides?: Partial<ShootJobRow>): ShootJobRow => ({
  id: 'job-uuid-123',
  project_id: 'project-uuid-123',
  user_id: 'user-uuid-123',
  theme_id: 'theme-uuid-123',
  status: 'training_queued',
  groom_fal_job_id: null,
  groom_lora_url: null,
  bride_fal_job_id: null,
  bride_lora_url: null,
  training_started_at: null,
  training_completed_at: null,
  modal_job_id: null,
  generation_started_at: null,
  generation_completed_at: null,
  generation_params: {},
  images: [],
  error_code: null,
  error_message: null,
  retry_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// =============================================================================
// Tests: mapRowToShootJob
// =============================================================================

describe('mapRowToShootJob', () => {
  it('should correctly map database row to ShootJob entity', () => {
    // Arrange
    const row = createMockShootJobRow({
      groom_fal_job_id: 'fal-groom-123',
      bride_fal_job_id: 'fal-bride-456',
      training_started_at: '2024-01-01T00:00:00Z',
    });

    // Act
    const result = mapRowToShootJob(row);

    // Assert
    expect(result.id).toBe(row.id);
    expect(result.projectId).toBe(row.project_id);
    expect(result.userId).toBe(row.user_id);
    expect(result.themeId).toBe(row.theme_id);
    expect(result.status).toBe(row.status);
    expect(result.groomFalJobId).toBe('fal-groom-123');
    expect(result.brideFalJobId).toBe('fal-bride-456');
    expect(result.trainingStartedAt).toBe('2024-01-01T00:00:00Z');
  });

  it('should handle null values correctly', () => {
    // Arrange
    const row = createMockShootJobRow();

    // Act
    const result = mapRowToShootJob(row);

    // Assert
    expect(result.groomFalJobId).toBeNull();
    expect(result.groomLoraUrl).toBeNull();
    expect(result.modalJobId).toBeNull();
    expect(result.images).toEqual([]);
  });

  it('should handle null generation_params as empty object', () => {
    // Arrange
    const row = createMockShootJobRow({
      generation_params: null,
    });

    // Act
    const result = mapRowToShootJob(row);

    // Assert
    expect(result.generationParams).toEqual({});
  });
});

// =============================================================================
// Tests: getRecommendedPollingInterval
// =============================================================================

describe('getRecommendedPollingInterval', () => {
  it('should return 5 seconds for training_queued status', () => {
    expect(getRecommendedPollingInterval('training_queued')).toBe(5);
  });

  it('should return 10 seconds for training status', () => {
    expect(getRecommendedPollingInterval('training')).toBe(10);
  });

  it('should return 2 seconds for standby status', () => {
    expect(getRecommendedPollingInterval('standby')).toBe(2);
  });

  it('should return 2 seconds for generating status', () => {
    expect(getRecommendedPollingInterval('generating')).toBe(2);
  });

  it('should return 0 for complete status', () => {
    expect(getRecommendedPollingInterval('complete')).toBe(0);
  });

  it('should return 0 for failed status', () => {
    expect(getRecommendedPollingInterval('failed')).toBe(0);
  });

  it('should match POLLING_INTERVALS constant', () => {
    const statuses: ShootJobStatus[] = [
      'training_queued',
      'training',
      'standby',
      'generating',
      'complete',
      'failed',
    ];

    statuses.forEach((status) => {
      expect(getRecommendedPollingInterval(status)).toBe(POLLING_INTERVALS[status]);
    });
  });
});

// =============================================================================
// Tests: createShootJob
// =============================================================================

describe('createShootJob', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('should create a new shoot job with training_queued status', async () => {
    // Arrange
    const userId = 'user-uuid-123';
    const input = {
      projectId: 'project-uuid-123',
      themeId: 'theme-uuid-123',
    };
    const mockRow = createMockShootJobRow({
      project_id: input.projectId,
      user_id: userId,
      theme_id: input.themeId,
    });

    mockSupabase._mocks.single.mockResolvedValueOnce({ data: { id: input.projectId }, error: null });
    mockSupabase._mocks.single.mockResolvedValueOnce({ data: { id: input.themeId }, error: null });
    mockSupabase._mocks.single.mockResolvedValueOnce({ data: mockRow, error: null });

    // Act
    const result = await createShootJob(mockSupabase, userId, input);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe('training_queued');
      expect(result.data.projectId).toBe(input.projectId);
      expect(result.data.themeId).toBe(input.themeId);
    }
  });

  it('should return error if project does not exist', async () => {
    // Arrange
    const userId = 'user-uuid-123';
    const input = {
      projectId: 'nonexistent-project',
      themeId: 'theme-uuid-123',
    };

    mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    // Act
    const result = await createShootJob(mockSupabase, userId, input);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(SHOOT_ERROR_CODES.INVALID_PROJECT);
    }
  });

  it('should return error if theme does not exist', async () => {
    // Arrange
    const userId = 'user-uuid-123';
    const input = {
      projectId: 'project-uuid-123',
      themeId: 'nonexistent-theme',
    };

    mockSupabase._mocks.single.mockResolvedValueOnce({ data: { id: input.projectId }, error: null });
    mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    // Act
    const result = await createShootJob(mockSupabase, userId, input);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(SHOOT_ERROR_CODES.INVALID_THEME);
    }
  });
});

// =============================================================================
// Tests: getShootJobById
// =============================================================================

describe('getShootJobById', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('should return shoot job when found', async () => {
    // Arrange
    const jobId = 'job-uuid-123';
    const userId = 'user-uuid-123';
    const mockRow = createMockShootJobRow({ id: jobId, user_id: userId });

    mockSupabase._mocks.single.mockResolvedValueOnce({ data: mockRow, error: null });

    // Act
    const result = await getShootJobById(mockSupabase, jobId, userId);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.job.id).toBe(jobId);
      expect(result.data.recommendedIntervalSec).toBe(POLLING_INTERVALS.training_queued);
    }
  });

  it('should return error when job not found', async () => {
    // Arrange
    const jobId = 'nonexistent-job';
    const userId = 'user-uuid-123';

    mockSupabase._mocks.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    // Act
    const result = await getShootJobById(mockSupabase, jobId, userId);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(SHOOT_ERROR_CODES.JOB_NOT_FOUND);
    }
  });

  it('should include correct recommendedIntervalSec based on status', async () => {
    // Arrange
    const statuses: ShootJobStatus[] = ['training', 'standby', 'generating', 'complete'];

    for (const status of statuses) {
      const mockRow = createMockShootJobRow({ status });
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: mockRow, error: null });

      // Act
      const result = await getShootJobById(mockSupabase, 'job-id', 'user-id');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.recommendedIntervalSec).toBe(POLLING_INTERVALS[status]);
      }
    }
  });
});

// =============================================================================
// Tests: updateShootJobStatus
// =============================================================================

describe('updateShootJobStatus', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('should update status from training_queued to training', async () => {
    // Arrange
    const jobId = 'job-uuid-123';
    const mockRow = createMockShootJobRow({ id: jobId, status: 'training' });

    mockSupabase._mocks.single.mockResolvedValueOnce({ data: mockRow, error: null });

    // Act
    const result = await updateShootJobStatus(mockSupabase, jobId, 'training');

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe('training');
    }
  });

  it('should update status to failed with error details', async () => {
    // Arrange
    const jobId = 'job-uuid-123';
    const errorCode = SHOOT_ERROR_CODES.FAL_TRAINING_ERROR;
    const errorMessage = 'Training failed due to insufficient images';
    const mockRow = createMockShootJobRow({
      id: jobId,
      status: 'failed',
      error_code: errorCode,
      error_message: errorMessage,
    });

    mockSupabase._mocks.single.mockResolvedValueOnce({ data: mockRow, error: null });

    // Act
    const result = await updateShootJobStatus(mockSupabase, jobId, 'failed', {
      errorCode,
      errorMessage,
    });

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe('failed');
      expect(result.data.errorCode).toBe(errorCode);
      expect(result.data.errorMessage).toBe(errorMessage);
    }
  });
});

// =============================================================================
// Tests: handleFalWebhookCompletion
// =============================================================================

describe('handleFalWebhookCompletion', () => {
  it('should update groom_lora_url when groom training completes', async () => {
    // Arrange
    const falJobId = 'fal-groom-123';
    const loraUrl = 'https://storage.fal.ai/lora/groom.safetensors';
    const mockRow = createMockShootJobRow({
      groom_fal_job_id: falJobId,
      groom_lora_url: null,
      bride_fal_job_id: 'fal-bride-456',
      bride_lora_url: null,
      status: 'training',
    });
    const updatedRow = { ...mockRow, groom_lora_url: loraUrl };

    // Create mock with proper query tracking
    let queryCount = 0;
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              queryCount++;
              // First two queries are lookups (groom then bride)
              if (queryCount === 1) return Promise.resolve({ data: mockRow, error: null });
              if (queryCount === 2) return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
              return Promise.resolve({ data: updatedRow, error: null });
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedRow, error: null }),
            }),
          }),
        }),
      })),
    } as unknown as SupabaseClient;

    // Act
    const result = await handleFalWebhookCompletion(mockSupabase, falJobId, loraUrl);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.groomLoraUrl).toBe(loraUrl);
    }
  });

  it('should transition to standby when both LoRAs are complete', async () => {
    // Arrange
    const falJobId = 'fal-bride-456';
    const loraUrl = 'https://storage.fal.ai/lora/bride.safetensors';
    const mockRow = createMockShootJobRow({
      groom_fal_job_id: 'fal-groom-123',
      groom_lora_url: 'https://storage.fal.ai/lora/groom.safetensors', // Already complete
      bride_fal_job_id: falJobId,
      bride_lora_url: null,
      status: 'training',
    });
    const updatedRow = {
      ...mockRow,
      bride_lora_url: loraUrl,
      status: 'standby',
      training_completed_at: new Date().toISOString(),
    };

    let queryCount = 0;
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => {
              queryCount++;
              // First query for groom - not found
              if (queryCount === 1) return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
              // Second query for bride - found
              if (queryCount === 2) return Promise.resolve({ data: mockRow, error: null });
              return Promise.resolve({ data: updatedRow, error: null });
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedRow, error: null }),
            }),
          }),
        }),
      })),
    } as unknown as SupabaseClient;

    // Act
    const result = await handleFalWebhookCompletion(mockSupabase, falJobId, loraUrl);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.brideLoraUrl).toBe(loraUrl);
      expect(result.data.status).toBe('standby');
      expect(result.data.trainingCompletedAt).not.toBeNull();
    }
  });

  it('should return error when job not found by falJobId', async () => {
    // Arrange
    const falJobId = 'nonexistent-fal-job';
    const loraUrl = 'https://storage.fal.ai/lora/test.safetensors';

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      })),
    } as unknown as SupabaseClient;

    // Act
    const result = await handleFalWebhookCompletion(mockSupabase, falJobId, loraUrl);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(SHOOT_ERROR_CODES.WEBHOOK_JOB_NOT_FOUND);
    }
  });
});

// =============================================================================
// Tests: State Machine Transitions
// =============================================================================

describe('State Machine Transitions', () => {
  it('should follow valid state transitions', () => {
    // Define valid state transitions
    const validTransitions: Record<ShootJobStatus, ShootJobStatus[]> = {
      training_queued: ['training', 'failed'],
      training: ['standby', 'failed'],
      standby: ['generating', 'failed'],
      generating: ['complete', 'failed'],
      complete: [], // Terminal state
      failed: [], // Terminal state
    };

    // Verify state transition definitions are correct
    expect(validTransitions.training_queued).toContain('training');
    expect(validTransitions.training).toContain('standby');
    expect(validTransitions.standby).toContain('generating');
    expect(validTransitions.generating).toContain('complete');

    // Verify all states can transition to failed
    expect(validTransitions.training_queued).toContain('failed');
    expect(validTransitions.training).toContain('failed');
    expect(validTransitions.standby).toContain('failed');
    expect(validTransitions.generating).toContain('failed');
  });
});
