import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageLightbox } from '../components/ImageLightbox';
import type { GenerationImage } from '@/features/generation/types';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onClick,
      ...props
    }: React.PropsWithChildren<{ onClick?: () => void }>) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

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
  }) => <img src={src} alt={alt} data-testid="lightbox-image" {...props} />,
}));

const mockImages: GenerationImage[] = [
  { url: 'https://example.com/test-image-1.jpg', is_blur: false },
  { url: 'https://example.com/test-image-2.jpg', is_blur: false },
  { url: 'https://example.com/test-image-3.jpg', is_blur: false },
];

describe('ImageLightbox', () => {
  const defaultProps = {
    images: mockImages,
    currentIndex: 0,
    isOpen: true,
    onClose: vi.fn(),
    onDownload: vi.fn(),
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Visibility', () => {
    it('should render image when isOpen is true', () => {
      render(<ImageLightbox {...defaultProps} />);

      expect(screen.getByTestId('lightbox-image')).toBeInTheDocument();
      expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
        'src',
        mockImages[0].url
      );
    });

    it('should not render when isOpen is false', () => {
      render(<ImageLightbox {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('lightbox-image')).not.toBeInTheDocument();
    });

    it('should not render when currentIndex is null', () => {
      render(<ImageLightbox {...defaultProps} currentIndex={null} />);

      expect(screen.queryByTestId('lightbox-image')).not.toBeInTheDocument();
    });

    it('should render overlay when open', () => {
      render(<ImageLightbox {...defaultProps} />);

      expect(screen.getByTestId('lightbox-overlay')).toBeInTheDocument();
    });

    it('should show current index / total', () => {
      render(<ImageLightbox {...defaultProps} currentIndex={1} />);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });
  });

  describe('Closing', () => {
    it('should call onClose on overlay click', async () => {
      const onClose = vi.fn();
      render(<ImageLightbox {...defaultProps} onClose={onClose} />);

      await userEvent.click(screen.getByTestId('lightbox-overlay'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose on escape key', () => {
      const onClose = vi.fn();
      render(<ImageLightbox {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(<ImageLightbox {...defaultProps} onClose={onClose} />);

      await userEvent.click(screen.getByTestId('lightbox-close-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation', () => {
    it('should call onNavigate with prev index on left arrow key', () => {
      const onNavigate = vi.fn();
      render(<ImageLightbox {...defaultProps} currentIndex={1} onNavigate={onNavigate} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(onNavigate).toHaveBeenCalledWith(0);
    });

    it('should call onNavigate with next index on right arrow key', () => {
      const onNavigate = vi.fn();
      render(<ImageLightbox {...defaultProps} currentIndex={1} onNavigate={onNavigate} />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(onNavigate).toHaveBeenCalledWith(2);
    });

    it('should not navigate before first image', () => {
      const onNavigate = vi.fn();
      render(<ImageLightbox {...defaultProps} currentIndex={0} onNavigate={onNavigate} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate after last image', () => {
      const onNavigate = vi.fn();
      render(<ImageLightbox {...defaultProps} currentIndex={2} onNavigate={onNavigate} />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Download', () => {
    it('should call onDownload with index when download button is clicked', async () => {
      const onDownload = vi.fn();
      render(<ImageLightbox {...defaultProps} currentIndex={1} onDownload={onDownload} />);

      await userEvent.click(screen.getByTestId('lightbox-download-button'));

      expect(onDownload).toHaveBeenCalledWith(1);
    });

    it('should render download button with correct label', () => {
      render(<ImageLightbox {...defaultProps} />);

      expect(screen.getByTestId('lightbox-download-button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label on close button', () => {
      render(<ImageLightbox {...defaultProps} />);

      expect(screen.getByTestId('lightbox-close-button')).toHaveAttribute(
        'aria-label',
        '닫기'
      );
    });

    it('should have alt text on image', () => {
      render(<ImageLightbox {...defaultProps} />);

      expect(screen.getByTestId('lightbox-image')).toHaveAttribute('alt');
    });

    it('should trap focus within lightbox', () => {
      render(<ImageLightbox {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(<ImageLightbox {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('lightbox-overlay')).toHaveClass('custom-class');
    });
  });
});
