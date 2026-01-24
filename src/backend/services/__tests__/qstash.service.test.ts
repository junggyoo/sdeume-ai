import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the QStash client
const mockPublishJSON = vi.fn();
vi.mock('@upstash/qstash', () => ({
  Client: vi.fn(() => ({
    publishJSON: mockPublishJSON,
  })),
}));

// Import after mocks
import { enqueueTrainingJob, type TrainingJobPayload } from '../qstash.service';

describe('QStash Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.QSTASH_TOKEN = 'test-qstash-token';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('enqueueTrainingJob', () => {
    const mockPayload: TrainingJobPayload = {
      generationId: 'gen-123',
      projectId: 'proj-456',
      userId: 'user-789',
    };

    it('should enqueue job to QStash in production environment', async () => {
      process.env.NODE_ENV = 'production';
      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      const result = await enqueueTrainingJob(mockPayload);

      expect(mockPublishJSON).toHaveBeenCalledWith({
        url: 'https://app.example.com/api/jobs/prepare-training',
        body: mockPayload,
        retries: 3,
      });
      expect(result).toEqual({ messageId: 'msg-123' });
    });

    it('should skip QStash and return dev-mode messageId in development', async () => {
      process.env.NODE_ENV = 'development';

      const result = await enqueueTrainingJob(mockPayload);

      expect(mockPublishJSON).not.toHaveBeenCalled();
      expect(result).toEqual({ messageId: 'dev-mode' });
    });

    it('should use correct webhook URL with app URL', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://custom.example.com';
      mockPublishJSON.mockResolvedValue({ messageId: 'msg-456' });

      await enqueueTrainingJob(mockPayload);

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://custom.example.com/api/jobs/prepare-training',
        })
      );
    });

    it('should include retry configuration', async () => {
      process.env.NODE_ENV = 'production';
      mockPublishJSON.mockResolvedValue({ messageId: 'msg-789' });

      await enqueueTrainingJob(mockPayload);

      expect(mockPublishJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          retries: 3,
        })
      );
    });

    it('should propagate QStash errors in production', async () => {
      process.env.NODE_ENV = 'production';
      mockPublishJSON.mockRejectedValue(new Error('QStash error'));

      await expect(enqueueTrainingJob(mockPayload)).rejects.toThrow('QStash error');
    });

    it('should handle missing QSTASH_TOKEN in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.QSTASH_TOKEN;

      // Should throw or handle gracefully - implementation decides
      // This test documents the expected behavior
      await expect(enqueueTrainingJob(mockPayload)).rejects.toThrow();
    });

    it('should handle missing NEXT_PUBLIC_APP_URL', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_APP_URL;
      mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

      // Should use fallback or throw - implementation decides
      await expect(enqueueTrainingJob(mockPayload)).rejects.toThrow();
    });

    it('should treat test environment same as development', async () => {
      process.env.NODE_ENV = 'test';

      const result = await enqueueTrainingJob(mockPayload);

      expect(mockPublishJSON).not.toHaveBeenCalled();
      expect(result).toEqual({ messageId: 'dev-mode' });
    });
  });
});
