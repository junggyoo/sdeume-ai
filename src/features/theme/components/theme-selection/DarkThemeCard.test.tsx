import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DarkThemeCard } from './DarkThemeCard';
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

describe('DarkThemeCard', () => {
  describe('rendering', () => {
    it('should render theme name in Korean', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByText('가든 스튜디오')).toBeInTheDocument();
    });

    it('should render theme name in English', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByText('Garden Studio')).toBeInTheDocument();
    });

    it('should render tagline', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(
        screen.getByText('초록빛 정원, 따스한 햇살 아래')
      ).toBeInTheDocument();
    });

    it('should have 3:4 aspect ratio', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const card = screen.getByTestId('theme-card');
      expect(card).toHaveClass('aspect-[3/4]');
    });

    it('should apply gradient background color from UI config', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const card = screen.getByTestId('theme-card');
      expect(card).toHaveClass('bg-gradient-to-br');
    });
  });

  describe('AI recommendation badge', () => {
    it('should show AI badge when theme is recommended', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByText('AI 추천')).toBeInTheDocument();
    });

    it('should not show AI badge when theme is not recommended', () => {
      const notRecommendedTheme = { ...mockTheme, isRecommended: false };
      render(
        <DarkThemeCard
          theme={notRecommendedTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.queryByText('AI 추천')).not.toBeInTheDocument();
    });

    it('should show recommend text when available', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByText('당신의 미소와 찰떡궁합')).toBeInTheDocument();
    });

    it('should have gradient background on AI badge', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const badge = screen.getByTestId('ai-badge');
      expect(badge).toHaveClass('bg-gradient-to-r');
      expect(badge).toHaveClass('from-pink-500');
    });
  });

  describe('selection state', () => {
    it('should show gold ring when selected', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={true}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const card = screen.getByTestId('theme-card');
      expect(card).toHaveClass('ring-4');
      expect(card).toHaveClass('ring-amber-400');
    });

    it('should show check icon when selected', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={true}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should not show check icon when not selected', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });
  });

  describe('sample view button', () => {
    it('should render sample view button', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByText('샘플 12종 보기')).toBeInTheDocument();
    });

    it('should have backdrop blur style', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const button = screen.getByTestId('sample-button');
      expect(button).toHaveClass('backdrop-blur-md');
    });

    it('should call onViewSamples when sample button clicked', () => {
      const handleViewSamples = vi.fn();
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={handleViewSamples}
        />
      );

      const button = screen.getByTestId('sample-button');
      fireEvent.click(button);

      expect(handleViewSamples).toHaveBeenCalledTimes(1);
    });

    it('should not trigger onSelect when sample button clicked', () => {
      const handleSelect = vi.fn();
      const handleViewSamples = vi.fn();
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={handleSelect}
          onViewSamples={handleViewSamples}
        />
      );

      const button = screen.getByTestId('sample-button');
      fireEvent.click(button);

      expect(handleSelect).not.toHaveBeenCalled();
      expect(handleViewSamples).toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('should call onSelect when card is clicked', () => {
      const handleSelect = vi.fn();
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={handleSelect}
          onViewSamples={() => {}}
        />
      );

      const card = screen.getByTestId('theme-card');
      fireEvent.click(card);

      expect(handleSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('face overlay', () => {
    it('should show face overlay badge when faceOverlay is true', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={true}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByTestId('face-overlay-badge')).toBeInTheDocument();
    });

    it('should not show face overlay badge when faceOverlay is false', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.queryByTestId('face-overlay-badge')).not.toBeInTheDocument();
    });

    it('should display "내 얼굴 적용" text in face overlay badge', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={true}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByText('내 얼굴 적용')).toBeInTheDocument();
    });

    it('should replace AI badge with face overlay badge when faceOverlay is true', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={true}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      // AI badge should not be shown when faceOverlay is active
      expect(screen.queryByTestId('ai-badge')).not.toBeInTheDocument();
      // Face overlay badge should be shown instead
      expect(screen.getByTestId('face-overlay-badge')).toBeInTheDocument();
    });

    it('should position face overlay badge at top-left', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={true}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const badge = screen.getByTestId('face-overlay-badge');
      expect(badge).toHaveClass('top-3');
      expect(badge).toHaveClass('left-3');
    });
  });

  describe('play button', () => {
    it('should show play button when not selected', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByTestId('play-button')).toBeInTheDocument();
    });

    it('should not show play button when selected', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={true}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.queryByTestId('play-button')).not.toBeInTheDocument();
    });

    it('should position play button at top-right', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const playButton = screen.getByTestId('play-button');
      expect(playButton).toHaveClass('top-3');
      expect(playButton).toHaveClass('right-3');
    });

    it('should call onViewSamples when play button is clicked', () => {
      const handleViewSamples = vi.fn();
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={handleViewSamples}
        />
      );

      const playButton = screen.getByTestId('play-button');
      fireEvent.click(playButton);

      expect(handleViewSamples).toHaveBeenCalledTimes(1);
    });

    it('should not trigger onSelect when play button is clicked', () => {
      const handleSelect = vi.fn();
      const handleViewSamples = vi.fn();
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={handleSelect}
          onViewSamples={handleViewSamples}
        />
      );

      const playButton = screen.getByTestId('play-button');
      fireEvent.click(playButton);

      expect(handleSelect).not.toHaveBeenCalled();
      expect(handleViewSamples).toHaveBeenCalled();
    });
  });

  describe('scale effect', () => {
    it('should have scale effect when selected', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={true}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const card = screen.getByTestId('theme-card');
      expect(card).toHaveClass('scale-[1.02]');
    });

    it('should not have scale effect when not selected', () => {
      render(
        <DarkThemeCard
          theme={mockTheme}
          isSelected={false}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const card = screen.getByTestId('theme-card');
      expect(card).not.toHaveClass('scale-[1.02]');
    });
  });
});
