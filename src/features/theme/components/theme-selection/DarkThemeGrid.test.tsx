import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DarkThemeGrid } from './DarkThemeGrid';
import type { ThemeWithUI } from '../../types';

const mockThemes: ThemeWithUI[] = [
  {
    id: 'white_studio',
    name: '화이트 스튜디오',
    slug: 'white_studio',
    description: '깔끔하고 미니멀한 자연광 스튜디오',
    thumbnailUrl: null,
    sampleImages: Array.from({ length: 12 }, (_, i) => `/white-sample-${i}.jpg`),
    tags: ['clean', 'minimal'],
    isRecommended: false,
    displayOrder: 1,
    createdAt: '2024-01-01',
    ui: {
      nameEn: 'White Studio',
      tagline: '순백의 공간에서 빛나는 두 사람',
      bgColor: 'bg-gradient-to-br from-gray-200 via-white to-gray-100',
      recommendText: '',
    },
  },
  {
    id: 'garden_studio',
    name: '가든 스튜디오',
    slug: 'garden_studio',
    description: '초록 정원과 따뜻한 햇살',
    thumbnailUrl: null,
    sampleImages: Array.from(
      { length: 12 },
      (_, i) => `/garden-sample-${i}.jpg`
    ),
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
  },
  {
    id: 'classic_studio',
    name: '클래식 스튜디오',
    slug: 'classic_studio',
    description: '웅장한 샹들리에와 호텔 예식 분위기',
    thumbnailUrl: null,
    sampleImages: Array.from(
      { length: 12 },
      (_, i) => `/classic-sample-${i}.jpg`
    ),
    tags: ['elegant', 'formal'],
    isRecommended: false,
    displayOrder: 3,
    createdAt: '2024-01-01',
    ui: {
      nameEn: 'Classic Studio',
      tagline: '품격 있는 공간, 특별한 순간',
      bgColor: 'bg-gradient-to-br from-amber-300 via-orange-200 to-yellow-100',
      recommendText: '',
    },
  },
];

describe('DarkThemeGrid', () => {
  describe('rendering', () => {
    it('should render grid container', () => {
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByTestId('theme-grid')).toBeInTheDocument();
    });

    it('should render all theme cards', () => {
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByText('화이트 스튜디오')).toBeInTheDocument();
      expect(screen.getByText('가든 스튜디오')).toBeInTheDocument();
      expect(screen.getByText('클래식 스튜디오')).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should have 3 column grid layout', () => {
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const grid = screen.getByTestId('theme-grid');
      expect(grid).toHaveClass('grid-cols-3');
    });

    it('should have gap-5 spacing', () => {
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const grid = screen.getByTestId('theme-grid');
      expect(grid).toHaveClass('gap-5');
    });

    it('should be hidden on mobile (hidden class)', () => {
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const grid = screen.getByTestId('theme-grid');
      expect(grid).toHaveClass('hidden');
    });

    it('should be visible on desktop (md:grid class)', () => {
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const grid = screen.getByTestId('theme-grid');
      expect(grid).toHaveClass('md:grid');
    });
  });

  describe('selection', () => {
    it('should pass selected state to correct theme card', () => {
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId="garden_studio"
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should call onSelect with theme id when card is clicked', () => {
      const handleSelect = vi.fn();
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={handleSelect}
          onViewSamples={() => {}}
        />
      );

      const cards = screen.getAllByTestId('theme-card');
      fireEvent.click(cards[1]); // Click garden studio

      expect(handleSelect).toHaveBeenCalledWith('garden_studio');
    });
  });

  describe('face overlay', () => {
    it('should pass faceOverlay prop to theme cards', () => {
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={true}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const badges = screen.getAllByTestId('face-overlay-badge');
      expect(badges).toHaveLength(3);
    });
  });

  describe('view samples', () => {
    it('should call onViewSamples when sample button is clicked', () => {
      const handleViewSamples = vi.fn();
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={handleViewSamples}
        />
      );

      const sampleButtons = screen.getAllByTestId('sample-button');
      fireEvent.click(sampleButtons[0]);

      expect(handleViewSamples).toHaveBeenCalledWith(mockThemes[0]);
    });

    it('should call onViewSamples when play button is clicked', () => {
      const handleViewSamples = vi.fn();
      render(
        <DarkThemeGrid
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={handleViewSamples}
        />
      );

      const playButtons = screen.getAllByTestId('play-button');
      fireEvent.click(playButtons[0]);

      expect(handleViewSamples).toHaveBeenCalledWith(mockThemes[0]);
    });
  });

  describe('empty state', () => {
    it('should render nothing when themes array is empty', () => {
      render(
        <DarkThemeGrid
          themes={[]}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.queryByTestId('theme-grid')).not.toBeInTheDocument();
    });
  });
});
