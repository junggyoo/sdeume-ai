import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SampleModal } from './SampleModal';
import type { ThemeWithUI } from '../../types';

const mockTheme: ThemeWithUI = {
  id: 'garden_studio',
  name: '가든 스튜디오',
  slug: 'garden_studio',
  description: '초록 정원과 따뜻한 햇살',
  thumbnailUrl: '/images/garden-thumb.jpg',
  sampleImages: Array.from({ length: 12 }, (_, i) => `/sample-${i}.jpg`),
  tags: ['natural', 'warm'],
  isRecommended: true,
  displayOrder: 2,
  createdAt: '2024-01-01',
  ui: {
    nameEn: 'Garden Studio',
    tagline: '초록빛 정원, 따스한 햇살 아래',
    bgColor: 'bg-gradient-to-br from-emerald-300 via-green-200 to-lime-100',
    recommendText: '당신의 미소와 찰떡궁합',
  },
};

describe('SampleModal', () => {
  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={false}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(screen.queryByTestId('sample-modal')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(screen.getByTestId('sample-modal')).toBeInTheDocument();
    });

    it('should not render when theme is null', () => {
      render(
        <SampleModal
          theme={null}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(screen.queryByTestId('sample-modal')).not.toBeInTheDocument();
    });
  });

  describe('header content', () => {
    it('should display theme name in Korean', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(screen.getByText('가든 스튜디오')).toBeInTheDocument();
    });

    it('should display tagline', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(
        screen.getByText('초록빛 정원, 따스한 햇살 아래')
      ).toBeInTheDocument();
    });

    it('should display close button', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });
  });

  describe('image grid', () => {
    it('should display 9 sample images in grid', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(9);
    });

    it('should have grid with 3 columns', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      const grid = screen.getByTestId('image-grid');
      expect(grid).toHaveClass('grid-cols-3');
    });

    it('should show "+ 3장 더 보기" text when there are more images', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(screen.getByText(/\+ 3장 더 보기/)).toBeInTheDocument();
    });

    it('should not show more text when images are 9 or less', () => {
      const themeWith9Images = {
        ...mockTheme,
        sampleImages: Array.from({ length: 9 }, (_, i) => `/sample-${i}.jpg`),
      };

      render(
        <SampleModal
          theme={themeWith9Images}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(screen.queryByText(/\+ \d+장 더 보기/)).not.toBeInTheDocument();
    });
  });

  describe('CTA button', () => {
    it('should display select button with correct text', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(
        screen.getByRole('button', { name: /이 테마로 선택하기/ })
      ).toBeInTheDocument();
    });

    it('should call onSelect when CTA button is clicked', () => {
      const handleSelect = vi.fn();
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={handleSelect}
        />
      );

      const selectButton = screen.getByRole('button', {
        name: /이 테마로 선택하기/,
      });
      fireEvent.click(selectButton);

      expect(handleSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('interactions', () => {
    it('should call onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={handleClose}
          onSelect={() => {}}
        />
      );

      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const handleClose = vi.fn();
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={handleClose}
          onSelect={() => {}}
        />
      );

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when modal content is clicked', () => {
      const handleClose = vi.fn();
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={handleClose}
          onSelect={() => {}}
        />
      );

      const modalContent = screen.getByTestId('modal-content');
      fireEvent.click(modalContent);

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should have dark background on modal content', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      const modalContent = screen.getByTestId('modal-content');
      expect(modalContent).toHaveClass('bg-slate-800');
    });

    it('should have rounded corners on modal content', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      const modalContent = screen.getByTestId('modal-content');
      expect(modalContent).toHaveClass('rounded-3xl');
    });
  });

  describe('accessibility', () => {
    it('should have proper role for modal', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(
        <SampleModal
          theme={mockTheme}
          isOpen={true}
          onClose={() => {}}
          onSelect={() => {}}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });
  });
});
