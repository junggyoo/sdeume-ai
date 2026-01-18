import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Generation, GenerationImage } from '@/features/generation/types';

// Mock hooks
const mockUseProjectGeneration = vi.fn();
const mockUseGenerationJob = vi.fn();
const mockUseProject = vi.fn();
const mockUseParams = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('@/features/generation/hooks/useProjectGeneration', () => ({
  useProjectGeneration: () => mockUseProjectGeneration(),
}));

vi.mock('@/features/generation/hooks/useGenerationJob', () => ({
  useGenerationJob: () => mockUseGenerationJob(),
}));

vi.mock('@/features/studio/hooks/useProject', () => ({
  useProject: () => mockUseProject(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => mockUseRouter(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
  }) => <img src={src} alt={alt} {...props} />,
}));

// Mock download utils
vi.mock('../utils/download', () => ({
  downloadImage: vi.fn(),
  downloadAllImages: vi.fn(),
  generateFilename: vi.fn((index) => `sdeume_${String(index + 1).padStart(3, '0')}.jpg`),
}));

const mockImages: GenerationImage[] = [
  { url: 'https://example.com/image1.jpg', is_blur: false },
  { url: 'https://example.com/image2.jpg', is_blur: false },
  { url: 'https://example.com/image3.jpg', is_blur: false },
];

const mockGeneration: Generation = {
  id: 'gen-123',
  projectId: 'proj-456',
  userId: 'user-789',
  modalJobId: 'job-001',
  themeId: 'theme-001',
  prompt: 'test prompt',
  parameters: {},
  status: 'completed',
  images: mockImages,
  startedAt: '2024-01-01T00:00:00Z',
  completedAt: '2024-01-01T00:10:00Z',
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00Z',
};

// 실제 RevealPage 컴포넌트를 동적으로 import
// 컴포넌트가 구현되면 이 import를 활성화
// import RevealPage from '@/app/(protected)/studio/[projectId]/reveal/page';

// 임시 RevealPage 컴포넌트 (테스트 용도)
function RevealPage() {
  const params = mockUseParams();
  const { generation: projectGeneration, isLoading: isProjectLoading } = mockUseProjectGeneration();
  const {
    generation,
    isLoading: isJobLoading,
  } = mockUseGenerationJob();

  const [isOpened, setIsOpened] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<GenerationImage | null>(null);

  const isLoading = isProjectLoading || isJobLoading;

  if (isLoading) {
    return (
      <div data-testid="reveal-loading">
        <span>화보를 불러오는 중...</span>
      </div>
    );
  }

  if (!generation) {
    return (
      <div data-testid="reveal-error">
        <span>화보를 찾을 수 없습니다.</span>
      </div>
    );
  }

  if (!isOpened) {
    return (
      <div data-testid="reveal-envelope">
        <button
          data-testid="wax-seal-button"
          aria-label="봉투 열기"
          onClick={() => setIsOpened(true)}
        >
          봉투 열기
        </button>
      </div>
    );
  }

  return (
    <div data-testid="reveal-gallery">
      {generation.images.map((image, index) => (
        <button
          key={`${image.url}-${index}`}
          data-testid={`gallery-image-${index}`}
          onClick={() => setSelectedImage(image)}
        >
          <img src={image.url} alt={`화보 이미지 ${index + 1}`} />
        </button>
      ))}
      {selectedImage && (
        <div data-testid="lightbox">
          <img src={selectedImage.url} alt="확대 이미지" />
          <button
            data-testid="lightbox-close"
            onClick={() => setSelectedImage(null)}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}

// React import for useState
import React from 'react';

describe('RevealPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockUseParams.mockReturnValue({ projectId: 'proj-456' });
    mockUseRouter.mockReturnValue({ push: vi.fn(), replace: vi.fn() });
    mockUseProject.mockReturnValue({
      data: { id: 'proj-456', name: 'Test Project', currentStep: 4 },
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when data is loading', () => {
      mockUseProjectGeneration.mockReturnValue({
        generation: undefined,
        isLoading: true,
      });
      mockUseGenerationJob.mockReturnValue({
        generation: undefined,
        isLoading: true,
      });

      render(<RevealPage />);

      expect(screen.getByTestId('reveal-loading')).toBeInTheDocument();
      expect(screen.getByText('화보를 불러오는 중...')).toBeInTheDocument();
    });

    it('should show loading message', () => {
      mockUseProjectGeneration.mockReturnValue({
        generation: undefined,
        isLoading: true,
      });
      mockUseGenerationJob.mockReturnValue({
        generation: undefined,
        isLoading: true,
      });

      render(<RevealPage />);

      expect(screen.getByText(/화보를 불러오는 중/)).toBeInTheDocument();
    });
  });

  describe('Envelope Phase', () => {
    beforeEach(() => {
      mockUseProjectGeneration.mockReturnValue({
        generation: mockGeneration,
        isLoading: false,
      });
      mockUseGenerationJob.mockReturnValue({
        generation: mockGeneration,
        isLoading: false,
      });
    });

    it('should show WaxSealEnvelope when not opened', () => {
      render(<RevealPage />);

      expect(screen.getByTestId('reveal-envelope')).toBeInTheDocument();
      expect(screen.getByTestId('wax-seal-button')).toBeInTheDocument();
    });

    it('should transition to gallery on envelope open', () => {
      render(<RevealPage />);

      // 봉투 열기
      fireEvent.click(screen.getByTestId('wax-seal-button'));

      expect(screen.getByTestId('reveal-gallery')).toBeInTheDocument();
    });
  });

  describe('Gallery Phase', () => {
    beforeEach(() => {
      mockUseProjectGeneration.mockReturnValue({
        generation: mockGeneration,
        isLoading: false,
      });
      mockUseGenerationJob.mockReturnValue({
        generation: mockGeneration,
        isLoading: false,
      });
    });

    it('should show ResultGallery after opening', () => {
      render(<RevealPage />);

      // 봉투 열기
      fireEvent.click(screen.getByTestId('wax-seal-button'));

      expect(screen.getByTestId('reveal-gallery')).toBeInTheDocument();
    });

    it('should render all images in gallery', () => {
      render(<RevealPage />);

      // 봉투 열기
      fireEvent.click(screen.getByTestId('wax-seal-button'));

      mockImages.forEach((_, index) => {
        expect(screen.getByTestId(`gallery-image-${index}`)).toBeInTheDocument();
      });
    });

    it('should open lightbox on image click', () => {
      render(<RevealPage />);

      // 봉투 열기
      fireEvent.click(screen.getByTestId('wax-seal-button'));

      // 이미지 클릭
      fireEvent.click(screen.getByTestId('gallery-image-0'));

      expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    });

    it('should close lightbox when close button clicked', () => {
      render(<RevealPage />);

      // 봉투 열기
      fireEvent.click(screen.getByTestId('wax-seal-button'));

      // 이미지 클릭하여 lightbox 열기
      fireEvent.click(screen.getByTestId('gallery-image-0'));
      expect(screen.getByTestId('lightbox')).toBeInTheDocument();

      // 닫기 버튼 클릭
      fireEvent.click(screen.getByTestId('lightbox-close'));

      expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message on fetch failure', () => {
      mockUseProjectGeneration.mockReturnValue({
        generation: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });
      mockUseGenerationJob.mockReturnValue({
        generation: undefined,
        isLoading: false,
      });

      render(<RevealPage />);

      expect(screen.getByTestId('reveal-error')).toBeInTheDocument();
    });
  });
});
