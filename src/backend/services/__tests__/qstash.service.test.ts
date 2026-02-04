import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the QStash client
const mockPublishJSON = vi.fn();
vi.mock('@upstash/qstash', () => ({
  Client: vi.fn(() => ({
    publishJSON: mockPublishJSON,
  })),
}));

// Import after mocks
import {
  enqueueTrainingJob,
  isLocalMode,
  resetQStashClient,
  type TrainingJobPayload,
} from '../qstash.service';

describe('QStash Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    resetQStashClient();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isLocalMode', () => {
    it('should return true when QSTASH_URL contains localhost', () => {
      process.env.QSTASH_URL = 'http://localhost:8080';
      expect(isLocalMode()).toBe(true);
    });

    it('should return false when QSTASH_URL is not set', () => {
      delete process.env.QSTASH_URL;
      expect(isLocalMode()).toBe(false);
    });

    it('should return false when QSTASH_URL is production URL', () => {
      process.env.QSTASH_URL = 'https://qstash.upstash.io';
      expect(isLocalMode()).toBe(false);
    });
  });

  describe('enqueueTrainingJob', () => {
    const mockPayload: TrainingJobPayload = {
      generationId: 'gen-123',
      projectId: 'proj-456',
      userId: 'user-789',
    };

    describe('production mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        process.env.QSTASH_TOKEN = 'test-qstash-token';
        process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
      });

      it('should enqueue job to QStash', async () => {
        mockPublishJSON.mockResolvedValue({ messageId: 'msg-123' });

        const result = await enqueueTrainingJob(mockPayload);

        expect(mockPublishJSON).toHaveBeenCalledWith({
          url: 'https://app.example.com/api/jobs/prepare-training',
          body: mockPayload,
          retries: 3,
        });
        expect(result).toEqual({ messageId: 'msg-123' });
      });

      it('should use correct webhook URL with app URL', async () => {
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
        mockPublishJSON.mockResolvedValue({ messageId: 'msg-789' });

        await enqueueTrainingJob(mockPayload);

        expect(mockPublishJSON).toHaveBeenCalledWith(
          expect.objectContaining({
            retries: 3,
          })
        );
      });

      it('should propagate QStash errors', async () => {
        mockPublishJSON.mockRejectedValue(new Error('QStash error'));

        await expect(enqueueTrainingJob(mockPayload)).rejects.toThrow(
          'QStash error'
        );
      });

      it('should throw when QSTASH_TOKEN is missing', async () => {
        delete process.env.QSTASH_TOKEN;

        await expect(enqueueTrainingJob(mockPayload)).rejects.toThrow(
          'QSTASH_TOKEN'
        );
      });

      it('should throw when NEXT_PUBLIC_APP_URL is missing', async () => {
        delete process.env.NEXT_PUBLIC_APP_URL;

        await expect(enqueueTrainingJob(mockPayload)).rejects.toThrow(
          'NEXT_PUBLIC_APP_URL'
        );
      });
    });

    describe('local mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
        process.env.QSTASH_URL = 'http://localhost:8080';
        process.env.QSTASH_TOKEN = 'local-token';
      });

      it('should enqueue job to local QStash server', async () => {
        mockPublishJSON.mockResolvedValue({ messageId: 'local-msg-123' });

        const result = await enqueueTrainingJob(mockPayload);

        expect(mockPublishJSON).toHaveBeenCalledWith({
          url: 'http://localhost:3000/api/jobs/prepare-training',
          body: mockPayload,
          retries: 3,
        });
        expect(result).toEqual({ messageId: 'local-msg-123' });
      });

      it('should ignore NEXT_PUBLIC_APP_URL and always use localhost:3000 in local mode', async () => {
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:4000';
        mockPublishJSON.mockResolvedValue({ messageId: 'local-msg-456' });

        await enqueueTrainingJob(mockPayload);

        // Local mode always uses localhost:3000 regardless of NEXT_PUBLIC_APP_URL
        expect(mockPublishJSON).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'http://localhost:3000/api/jobs/prepare-training',
          })
        );
      });
    });

    describe('skip mode (no QStash config)', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
        delete process.env.QSTASH_TOKEN;
        delete process.env.QSTASH_URL;
      });

      it('should skip QStash and return dev-mode messageId', async () => {
        const result = await enqueueTrainingJob(mockPayload);

        expect(mockPublishJSON).not.toHaveBeenCalled();
        expect(result).toEqual({ messageId: 'dev-mode' });
      });

      it('should skip in test environment without config', async () => {
        process.env.NODE_ENV = 'test';

        const result = await enqueueTrainingJob(mockPayload);

        expect(mockPublishJSON).not.toHaveBeenCalled();
        expect(result).toEqual({ messageId: 'dev-mode' });
      });
    });
  });
});
