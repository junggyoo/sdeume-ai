import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DropImage } from '../components/DropImage';
import { TIMING, BLUR_STAGES } from '../constants';
import type { GenerationImage } from '@/features/generation/types';

// Mock framer-motion - pass through all props including data-testid
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      style,
      initial,
      animate,
      transition,
      ...props
    }: React.PropsWithChildren<{
      style?: React.CSSProperties;
      initial?: object;
      animate?: object;
      transition?: object;
    }>) => (
      <div style={style} {...props}>
        {children}
      </div>
    ),
  },
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
  }) => <img src={src} alt={alt} data-testid="next-image" {...props} />,
}));

const mockImage: GenerationImage = {
  url: 'https://example.com/test-image.jpg',
  is_blur: false,
};

describe('DropImage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should start with blur(12px) filter (dropping state)', () => {
      render(<DropImage image={mockImage} index={0} />);

      const container = screen.getByTestId('blur-container');
      expect(container).toHaveStyle({ filter: BLUR_STAGES.dropping });
    });

    it('should render the image with correct src and alt', () => {
      render(<DropImage image={mockImage} index={2} />);

      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('src', mockImage.url);
      expect(img).toHaveAttribute('alt', 'Generated image 3');
    });
  });

  describe('Blur Transitions', () => {
    it('should transition to blur(8px) after 500ms (processing state)', () => {
      render(<DropImage image={mockImage} index={0} />);

      act(() => {
        vi.advanceTimersByTime(TIMING.blurToProcessing + 50);
      });

      const container = screen.getByTestId('blur-container');
      expect(container).toHaveStyle({ filter: BLUR_STAGES.processing });
    });

    it('should transition to blur(0px) after 1500ms (revealed state)', () => {
      render(<DropImage image={mockImage} index={0} />);

      act(() => {
        vi.advanceTimersByTime(TIMING.processingToRevealed + 50);
      });

      const container = screen.getByTestId('blur-container');
      expect(container).toHaveStyle({ filter: BLUR_STAGES.revealed });
    });
  });

  describe('Shimmer Overlay', () => {
    it('should show shimmer overlay during processing state', () => {
      render(<DropImage image={mockImage} index={0} />);

      act(() => {
        vi.advanceTimersByTime(TIMING.blurToProcessing + 50);
      });

      expect(screen.getByTestId('shimmer-overlay')).toBeInTheDocument();
    });

    it('should hide shimmer overlay after revealed state', () => {
      render(<DropImage image={mockImage} index={0} />);

      act(() => {
        vi.advanceTimersByTime(TIMING.processingToRevealed + 50);
      });

      expect(screen.queryByTestId('shimmer-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onDropComplete when image is revealed', () => {
      const onDropComplete = vi.fn();
      render(
        <DropImage image={mockImage} index={0} onDropComplete={onDropComplete} />
      );

      act(() => {
        vi.advanceTimersByTime(TIMING.processingToRevealed + 50);
      });

      expect(onDropComplete).toHaveBeenCalledTimes(1);
    });

    it('should not call onDropComplete before reveal', () => {
      const onDropComplete = vi.fn();
      render(
        <DropImage image={mockImage} index={0} onDropComplete={onDropComplete} />
      );

      act(() => {
        vi.advanceTimersByTime(TIMING.blurToProcessing - 100);
      });

      expect(onDropComplete).not.toHaveBeenCalled();
    });
  });

  describe('Stack Positioning', () => {
    it('should have z-index equal to index', () => {
      render(<DropImage image={mockImage} index={5} />);

      const dropImage = screen.getByTestId('drop-image');
      expect(dropImage).toHaveStyle({ zIndex: 5 });
    });

    it('should have negative marginTop for index > 0', () => {
      render(<DropImage image={mockImage} index={3} />);

      const dropImage = screen.getByTestId('drop-image');
      expect(dropImage).toHaveStyle({ marginTop: '-20px' });
    });

    it('should have no marginTop for index 0', () => {
      render(<DropImage image={mockImage} index={0} />);

      const dropImage = screen.getByTestId('drop-image');
      expect(dropImage).toHaveStyle({ marginTop: 0 });
    });
  });
});
