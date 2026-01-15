import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { GenerationStatus, Generation } from '@/features/generation/types';

// Mock useParams and useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'test-project-123' }),
  useRouter: () => ({ push: mockPush }),
}));

// Mock react-use
vi.mock('react-use', () => ({
  useNetworkState: () => ({ online: true }),
}));

// Mock useProject
vi.mock('@/features/project/hooks/useProject', () => ({
  useProject: () => ({
    data: {
      id: 'test-project-123',
      selectedThemeId: 'theme-123',
    },
  }),
}));

// Create mock for useProjectGeneration
const mockCreateGeneration = vi.fn().mockResolvedValue({ id: 'gen-123' });
let mockProjectGeneration: { id: string } | null = { id: 'gen-123' };
let mockIsLoadingGeneration = false;
let mockIsCreating = false;

vi.mock('@/features/generation/hooks/useProjectGeneration', () => ({
  useProjectGeneration: () => ({
    generation: mockProjectGeneration,
    isLoading: mockIsLoadingGeneration,
    createGeneration: mockCreateGeneration,
    isCreating: mockIsCreating,
  }),
}));

// Create mock for useGenerationJob
const mockConsumeNewImage = vi.fn();
const mockClearNewImagesQueue = vi.fn();
let mockGenerationData: Partial<Generation> | undefined = undefined;
let mockNewImagesQueue: { url: string; is_blur: boolean }[] = [];
let mockIsPollingLoading = false;
let mockPollingError: Error | null = null;

vi.mock('@/features/generation/hooks/useGenerationJob', () => ({
  useGenerationJob: () => ({
    generation: mockGenerationData,
    isLoading: mockIsPollingLoading,
    isPolling: true,
    error: mockPollingError,
    newImagesQueue: mockNewImagesQueue,
    consumeNewImage: mockConsumeNewImage,
    clearNewImagesQueue: mockClearNewImagesQueue,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <p {...props}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Import after mocks
import ShootingPage from '@/app/(protected)/studio/[projectId]/shooting/page';

describe('ShootingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerationData = undefined;
    mockNewImagesQueue = [];
    mockIsPollingLoading = false;
    mockPollingError = null;
    mockProjectGeneration = { id: 'gen-123' };
    mockIsLoadingGeneration = false;
    mockIsCreating = false;
  });

  describe('Phase Determination', () => {
    it('should show TrainingProgress when status is queued', async () => {
      mockGenerationData = { status: 'queued' as GenerationStatus, images: [] };

      render(<ShootingPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/작가님이 두 분의 빛을 익히는 중이에요/i)
        ).toBeInTheDocument();
      });
    });

    it('should show TrainingProgress when status is training', async () => {
      mockGenerationData = {
        status: 'training' as GenerationStatus,
        images: [],
      };

      render(<ShootingPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/작가님이 두 분의 빛을 익히는 중이에요/i)
        ).toBeInTheDocument();
      });
    });

    it('should show LiveDarkroom when status is generating', async () => {
      mockGenerationData = {
        status: 'generating' as GenerationStatus,
        images: [],
      };

      render(<ShootingPage />);

      await waitFor(() => {
        expect(screen.getByText('촬영 중')).toBeInTheDocument();
      });
    });

    it('should redirect to reveal when status is completed', async () => {
      mockGenerationData = {
        status: 'completed' as GenerationStatus,
        images: [],
      };

      render(<ShootingPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/studio/test-project-123/reveal'
        );
      });
    });

    it('should show error state when status is failed', async () => {
      mockGenerationData = { status: 'failed' as GenerationStatus, images: [] };
      mockPollingError = new Error('Generation failed');

      render(<ShootingPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/촬영 중 문제가 발생했어요/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state when data is loading', () => {
      mockIsLoadingGeneration = true;
      mockGenerationData = undefined;

      render(<ShootingPage />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
  });

  describe('Image Processing', () => {
    it('should consume images from queue one at a time', async () => {
      mockGenerationData = {
        status: 'generating' as GenerationStatus,
        images: [],
      };
      mockNewImagesQueue = [
        { url: 'https://example.com/img1.jpg', is_blur: false },
      ];

      render(<ShootingPage />);

      await waitFor(() => {
        expect(mockConsumeNewImage).toHaveBeenCalled();
      });
    });
  });

  describe('Background', () => {
    it('should render aurora background', () => {
      mockGenerationData = {
        status: 'training' as GenerationStatus,
        images: [],
      };

      render(<ShootingPage />);

      expect(screen.getByTestId('aurora-background')).toBeInTheDocument();
    });
  });
});
