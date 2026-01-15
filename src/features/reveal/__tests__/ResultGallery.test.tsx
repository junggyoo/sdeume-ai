import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultGallery } from '../components/ResultGallery';
import type { GenerationImage } from '@/features/generation/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
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
    fill?: boolean;
    className?: string;
    'data-testid'?: string;
  }) => <img src={src} alt={alt} data-testid={props['data-testid']} {...props} />,
}));

const mockImages: GenerationImage[] = [
  { url: 'https://example.com/image1.jpg', is_blur: false },
  { url: 'https://example.com/image2.jpg', is_blur: false },
  { url: 'https://example.com/image3.jpg', is_blur: false },
  { url: 'https://example.com/image4.jpg', is_blur: false },
];

describe('ResultGallery', () => {
  const defaultProps = {
    images: mockImages,
    onImageClick: vi.fn(),
    onDownload: vi.fn(),
    onDownloadAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render all images', () => {
      render(<ResultGallery {...defaultProps} />);

      const images = screen.getAllByTestId(/^gallery-image-/);
      expect(images).toHaveLength(mockImages.length);
    });

    it('should render hero section for first image', () => {
      render(<ResultGallery {...defaultProps} />);

      expect(screen.getByTestId('gallery-hero')).toBeInTheDocument();
      const heroImage = screen.getByTestId('gallery-image-0');
      expect(heroImage).toHaveAttribute('src', mockImages[0].url);
    });

    it('should render masonry grid for remaining images', () => {
      render(<ResultGallery {...defaultProps} />);

      expect(screen.getByTestId('gallery-masonry')).toBeInTheDocument();
    });

    it('should apply masonry layout classes', () => {
      render(<ResultGallery {...defaultProps} />);

      const masonry = screen.getByTestId('gallery-masonry');
      expect(masonry).toHaveClass('columns-2', 'md:columns-3', 'gap-4');
    });

    it('should render images with correct alt text', () => {
      render(<ResultGallery {...defaultProps} />);

      expect(screen.getByAltText('화보 이미지 1')).toBeInTheDocument();
      expect(screen.getByAltText('화보 이미지 2')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onImageClick when hero image is clicked', async () => {
      const onImageClick = vi.fn();
      render(<ResultGallery {...defaultProps} onImageClick={onImageClick} />);

      await userEvent.click(screen.getByTestId('gallery-hero-button'));

      expect(onImageClick).toHaveBeenCalledWith(mockImages[0], 0);
    });

    it('should call onImageClick when grid image is clicked', async () => {
      const onImageClick = vi.fn();
      render(<ResultGallery {...defaultProps} onImageClick={onImageClick} />);

      // 두 번째 이미지 클릭 (인덱스 1)
      await userEvent.click(screen.getByTestId('gallery-item-button-1'));

      expect(onImageClick).toHaveBeenCalledWith(mockImages[1], 1);
    });

    it('should call onDownload when download button is clicked on image', async () => {
      const onDownload = vi.fn();
      render(<ResultGallery {...defaultProps} onDownload={onDownload} />);

      // hero 이미지의 다운로드 버튼 클릭
      await userEvent.click(screen.getByTestId('gallery-download-button-0'));

      expect(onDownload).toHaveBeenCalledWith(mockImages[0]);
    });

    it('should call onDownloadAll when download all button is clicked', async () => {
      const onDownloadAll = vi.fn();
      render(<ResultGallery {...defaultProps} onDownloadAll={onDownloadAll} />);

      await userEvent.click(screen.getByTestId('gallery-download-all-button'));

      expect(onDownloadAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty images array', () => {
      render(<ResultGallery {...defaultProps} images={[]} />);

      expect(screen.getByTestId('gallery-empty')).toBeInTheDocument();
      expect(screen.getByText('생성된 이미지가 없습니다.')).toBeInTheDocument();
    });

    it('should handle single image (hero only, no masonry)', () => {
      render(
        <ResultGallery
          {...defaultProps}
          images={[{ url: 'https://example.com/single.jpg', is_blur: false }]}
        />
      );

      expect(screen.getByTestId('gallery-hero')).toBeInTheDocument();
      expect(screen.queryByTestId('gallery-masonry')).not.toBeInTheDocument();
    });

    it('should not render download all button when images are empty', () => {
      render(<ResultGallery {...defaultProps} images={[]} />);

      expect(
        screen.queryByTestId('gallery-download-all-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      render(<ResultGallery {...defaultProps} className="custom-gallery" />);

      expect(screen.getByTestId('result-gallery')).toHaveClass('custom-gallery');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<ResultGallery {...defaultProps} />);

      const heroButton = screen.getByTestId('gallery-hero-button');
      expect(heroButton).toHaveAttribute('aria-label', '이미지 1 크게 보기');
    });

    it('should have aria-label on download buttons', () => {
      render(<ResultGallery {...defaultProps} />);

      const downloadButton = screen.getByTestId('gallery-download-button-0');
      expect(downloadButton).toHaveAttribute('aria-label', '이미지 1 다운로드');
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<ResultGallery {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('gallery-loading')).toBeInTheDocument();
    });

    it('should not show images when loading', () => {
      render(<ResultGallery {...defaultProps} isLoading={true} />);

      expect(screen.queryByTestId('gallery-hero')).not.toBeInTheDocument();
    });
  });
});
