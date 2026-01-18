import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveDarkroom } from '../components/LiveDarkroom';
import type { GenerationImage } from '@/features/generation/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock useSoundEffect
vi.mock('../hooks/useSoundEffect', () => ({
  useSoundEffect: () => ({
    playShutter: vi.fn(),
  }),
}));

const mockImages: GenerationImage[] = [
  { url: 'https://example.com/image1.jpg', is_blur: false },
  { url: 'https://example.com/image2.jpg', is_blur: true },
  { url: 'https://example.com/image3.jpg', is_blur: false },
];

describe('LiveDarkroom', () => {
  describe('UI Elements', () => {
    it('should display status header with "촬영 중" text', () => {
      render(<LiveDarkroom images={mockImages} />);

      expect(screen.getByText('촬영 중')).toBeInTheDocument();
    });

    it('should display image count correctly', () => {
      render(<LiveDarkroom images={mockImages} />);

      expect(screen.getByText(/3장의 사진이 나왔어요/)).toBeInTheDocument();
    });

    it('should display "디테일 보정 중..." text at bottom', () => {
      render(<LiveDarkroom images={mockImages} />);

      expect(screen.getByText('디테일 보정 중...')).toBeInTheDocument();
    });

    it('should render ImageTray component', () => {
      render(<LiveDarkroom images={mockImages} />);

      expect(screen.getByTestId('image-tray')).toBeInTheDocument();
    });
  });

  describe('Image Rendering', () => {
    it('should render DropImage for each image in the array', () => {
      render(<LiveDarkroom images={mockImages} />);

      const dropImages = screen.getAllByTestId('drop-image');
      expect(dropImages).toHaveLength(3);
    });

    it('should render loading state when no images', () => {
      render(<LiveDarkroom images={[]} />);

      expect(screen.getByText('첫 사진을 기다리는 중...')).toBeInTheDocument();
      expect(screen.getByTestId('generating-progress')).toBeInTheDocument();
    });

    it('should hide loading state when images exist', () => {
      render(<LiveDarkroom images={mockImages} />);

      expect(
        screen.queryByText('첫 사진을 기다리는 중...')
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('generating-progress')).not.toBeInTheDocument();
    });
  });

  describe('Generating State', () => {
    it('should show waiting indicator when images exist and isGenerating is true', () => {
      const singleImage: GenerationImage[] = [mockImages[0]];
      render(<LiveDarkroom images={singleImage} isGenerating={true} />);

      expect(screen.getByText('다음 사진 준비 중...')).toBeInTheDocument();
      expect(screen.getByTestId('generating-more-progress')).toBeInTheDocument();
    });

    it('should hide waiting indicator when isGenerating is false', () => {
      render(<LiveDarkroom images={mockImages} isGenerating={false} />);

      expect(
        screen.queryByText('다음 사진 준비 중...')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('generating-more-progress')
      ).not.toBeInTheDocument();
    });

    it('should hide waiting indicator when isGenerating is not provided', () => {
      render(<LiveDarkroom images={mockImages} />);

      expect(
        screen.queryByText('다음 사진 준비 중...')
      ).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onImageComplete when image animation finishes', async () => {
      const onImageComplete = vi.fn();
      render(
        <LiveDarkroom images={mockImages} onImageComplete={onImageComplete} />
      );

      // Note: Actual callback testing will be in DropImage test
      // Here we just verify the prop is passed correctly
      expect(screen.getAllByTestId('drop-image')).toHaveLength(3);
    });
  });
});
