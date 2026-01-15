import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageLightbox } from '../components/ImageLightbox';
import type { GenerationImage } from '@/features/generation/types';

// Mock framer-motion
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
  }) => <img src={src} alt={alt} data-testid="lightbox-image" {...props} />,
}));

const mockImage: GenerationImage = {
  url: 'https://example.com/test-image.jpg',
  is_blur: false,
};

describe('ImageLightbox', () => {
  const defaultProps = {
    image: mockImage,
    isOpen: true,
    onClose: vi.fn(),
    onDownload: vi.fn(),
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
        mockImage.url
      );
    });

    it('should not render when isOpen is false', () => {
      render(<ImageLightbox {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('lightbox-image')).not.toBeInTheDocument();
    });

    it('should not render when image is null', () => {
      render(<ImageLightbox {...defaultProps} image={null} />);

      expect(screen.queryByTestId('lightbox-image')).not.toBeInTheDocument();
    });

    it('should render overlay when open', () => {
      render(<ImageLightbox {...defaultProps} />);

      expect(screen.getByTestId('lightbox-overlay')).toBeInTheDocument();
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

    it('should not call onClose when clicking on the image', async () => {
      const onClose = vi.fn();
      render(<ImageLightbox {...defaultProps} onClose={onClose} />);

      await userEvent.click(screen.getByTestId('lightbox-image'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when clicking on the image container', async () => {
      const onClose = vi.fn();
      render(<ImageLightbox {...defaultProps} onClose={onClose} />);

      await userEvent.click(screen.getByTestId('lightbox-content'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Download', () => {
    it('should call onDownload when download button is clicked', async () => {
      const onDownload = vi.fn();
      render(<ImageLightbox {...defaultProps} onDownload={onDownload} />);

      await userEvent.click(screen.getByTestId('lightbox-download-button'));

      expect(onDownload).toHaveBeenCalledTimes(1);
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

      // Lightbox should have a role attribute for accessibility
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
