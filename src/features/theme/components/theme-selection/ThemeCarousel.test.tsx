import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeCarousel } from './ThemeCarousel';
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

describe('ThemeCarousel', () => {
  describe('rendering', () => {
    it('should render carousel container', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.getByTestId('theme-carousel')).toBeInTheDocument();
    });

    it('should render all theme cards', () => {
      render(
        <ThemeCarousel
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

    it('should have md:hidden class for mobile only', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const carousel = screen.getByTestId('theme-carousel');
      expect(carousel).toHaveClass('md:hidden');
    });
  });

  describe('scroll snap', () => {
    it('should have scroll-snap-x class on container', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const scrollContainer = screen.getByTestId('carousel-scroll');
      expect(scrollContainer).toHaveClass('snap-x');
    });

    it('should have snap-mandatory class', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const scrollContainer = screen.getByTestId('carousel-scroll');
      expect(scrollContainer).toHaveClass('snap-mandatory');
    });

    it('should have overflow-x-auto for horizontal scroll', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const scrollContainer = screen.getByTestId('carousel-scroll');
      expect(scrollContainer).toHaveClass('overflow-x-auto');
    });
  });

  describe('dot indicators', () => {
    it('should render dot indicators for each theme', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const dots = screen.getAllByTestId('dot-indicator');
      expect(dots).toHaveLength(3);
    });

    it('should highlight active dot based on scroll position', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      // First dot should be active by default
      const dots = screen.getAllByTestId('dot-indicator');
      expect(dots[0]).toHaveClass('bg-white');
    });

    it('should show inactive dots with reduced opacity', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      const dots = screen.getAllByTestId('dot-indicator');
      // Non-active dots should have reduced opacity
      expect(dots[1]).toHaveClass('bg-white/40');
      expect(dots[2]).toHaveClass('bg-white/40');
    });
  });

  describe('selection', () => {
    it('should pass selected state to correct theme card', () => {
      render(
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId="garden_studio"
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      // Check that the selected card has the check icon
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should call onSelect with theme id when card is clicked', () => {
      const handleSelect = vi.fn();
      render(
        <ThemeCarousel
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
        <ThemeCarousel
          themes={mockThemes}
          selectedThemeId={null}
          faceOverlay={true}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      // When faceOverlay is true, face overlay badge should be visible
      const badges = screen.getAllByTestId('face-overlay-badge');
      expect(badges).toHaveLength(3);
    });
  });

  describe('view samples', () => {
    it('should call onViewSamples when sample button is clicked', () => {
      const handleViewSamples = vi.fn();
      render(
        <ThemeCarousel
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
        <ThemeCarousel
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
        <ThemeCarousel
          themes={[]}
          selectedThemeId={null}
          faceOverlay={false}
          onSelect={() => {}}
          onViewSamples={() => {}}
        />
      );

      expect(screen.queryByTestId('theme-carousel')).not.toBeInTheDocument();
    });
  });
});
