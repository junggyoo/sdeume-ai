import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DropImage } from '../components/DropImage';
import { TIMING, BLUR_STAGES } from '../constants';
import type { GenerationImage } from '@/features/generation/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      style,
      ...props
    }: React.PropsWithChildren<{ style?: React.CSSProperties }>) => (
      <div data-testid="motion-div" style={style} {...props}>
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
    it('should transition to blur(8px) after 500ms (processing state)', async () => {
      render(<DropImage image={mockImage} index={0} />);

      await act(async () => {
        vi.advanceTimersByTime(TIMING.blurToProcessing);
      });

      const container = screen.getByTestId('blur-container');
      await waitFor(() => {
        expect(container).toHaveStyle({ filter: BLUR_STAGES.processing });
      });
    });

    it('should transition to blur(0px) after 1500ms (revealed state)', async () => {
      render(<DropImage image={mockImage} index={0} />);

      await act(async () => {
        vi.advanceTimersByTime(TIMING.processingToRevealed);
      });

      const container = screen.getByTestId('blur-container');
      await waitFor(() => {
        expect(container).toHaveStyle({ filter: BLUR_STAGES.revealed });
      });
    });
  });

  describe('Shimmer Overlay', () => {
    it('should show shimmer overlay during processing state', async () => {
      render(<DropImage image={mockImage} index={0} />);

      await act(async () => {
        vi.advanceTimersByTime(TIMING.blurToProcessing);
      });

      await waitFor(() => {
        expect(screen.getByTestId('shimmer-overlay')).toBeInTheDocument();
      });
    });

    it('should hide shimmer overlay after revealed state', async () => {
      render(<DropImage image={mockImage} index={0} />);

      await act(async () => {
        vi.advanceTimersByTime(TIMING.processingToRevealed);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('shimmer-overlay')).not.toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onDropComplete when image is revealed', async () => {
      const onDropComplete = vi.fn();
      render(
        <DropImage image={mockImage} index={0} onDropComplete={onDropComplete} />
      );

      await act(async () => {
        vi.advanceTimersByTime(TIMING.processingToRevealed);
      });

      await waitFor(() => {
        expect(onDropComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onDropComplete before reveal', async () => {
      const onDropComplete = vi.fn();
      render(
        <DropImage image={mockImage} index={0} onDropComplete={onDropComplete} />
      );

      await act(async () => {
        vi.advanceTimersByTime(TIMING.blurToProcessing - 100);
      });

      expect(onDropComplete).not.toHaveBeenCalled();
    });
  });

  describe('Stack Positioning', () => {
    it('should have z-index equal to index', () => {
      render(<DropImage image={mockImage} index={5} />);

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveStyle({ zIndex: 5 });
    });

    it('should have negative marginTop for index > 0', () => {
      render(<DropImage image={mockImage} index={3} />);

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveStyle({ marginTop: '-20px' });
    });

    it('should have no marginTop for index 0', () => {
      render(<DropImage image={mockImage} index={0} />);

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveStyle({ marginTop: 0 });
    });
  });
});
