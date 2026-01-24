import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @upstash/qstash before other imports
vi.mock('@upstash/qstash/nextjs', () => ({
  verifySignatureAppRouter: (handler: (req: Request) => Promise<Response>) => handler,
}));

// Create mock functions with proper chaining
const createMockChain = (returnValue: { data: unknown; error: unknown }) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
  };
  return chain;
};

let mockChain = createMockChain({ data: null, error: null });

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockChain),
  })),
}));

// Mock storage service
const mockCreateTrainingZip = vi.fn();
vi.mock('@/backend/services/storage.service', () => ({
  createTrainingZip: mockCreateTrainingZip,
}));

// Mock fal-client
const mockStartLoraTraining = vi.fn();
vi.mock('@/backend/services/fal-client', () => ({
  startLoraTraining: mockStartLoraTraining,
}));

// Mock lora-model service
const mockCreateLoraModel = vi.fn();
vi.mock('@/backend/services/lora-model.service', () => ({
  createLoraModel: mockCreateLoraModel,
}));

describe('Prepare Training Job Handler', () => {
  const originalEnv = process.env;

  const validPayload = {
    generationId: 'gen-123',
    projectId: 'proj-456',
    userId: 'user-789',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SECRET_KEY: 'test-secret-key',
      FAL_KEY: 'test-fal-key',
      NEXT_PUBLIC_APP_URL: 'https://app.example.com',
    };
    // Reset mock chain
    mockChain = createMockChain({ data: null, error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('Idempotency', () => {
    it('should skip processing and return success if generation status is not queued', async () => {
      // Setup: generation is already in 'training' status
      mockChain = createMockChain({
        data: { status: 'training' },
        error: null,
      });

      // Re-import handler after setting up mock
      vi.resetModules();
      const { handlePrepareTraining } = await import('../prepare-training/handler');

      const result = await handlePrepareTraining(validPayload);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it('should skip processing if generation is not found', async () => {
      mockChain = createMockChain({
        data: null,
        error: null,
      });

      vi.resetModules();
      const { handlePrepareTraining } = await import('../prepare-training/handler');

      const result = await handlePrepareTraining(validPayload);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return error when database query fails', async () => {
      mockChain = createMockChain({
        data: null,
        error: { message: 'Database connection failed' },
      });

      vi.resetModules();
      const { handlePrepareTraining } = await import('../prepare-training/handler');

      const result = await handlePrepareTraining(validPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('Service Role Key Usage', () => {
    it('should use SUPABASE_SECRET_KEY for admin access', async () => {
      mockChain = createMockChain({
        data: { status: 'training' },
        error: null,
      });

      vi.resetModules();
      const { createClient } = await import('@supabase/supabase-js');
      const { handlePrepareTraining } = await import('../prepare-training/handler');

      await handlePrepareTraining(validPayload);

      expect(createClient).toHaveBeenCalledWith(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY,
        expect.any(Object)
      );
    });
  });
});
