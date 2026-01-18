import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GallerySection } from './GallerySection';
import type { Pictorial } from '../types';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt, ...props }),
}));

const createMockPictorial = (overrides: Partial<Pictorial> = {}): Pictorial => ({
  id: 'pictorial-1',
  projectId: 'project-1',
  projectName: 'My Wedding',
  themeName: 'romantic',
  themeDisplayNameKo: '로맨틱',
  images: [
    { url: 'https://example.com/image1.jpg', is_blur: false },
    { url: 'https://example.com/image2.jpg', is_blur: false },
  ],
  completedAt: '2024-01-15T12:00:00Z',
  createdAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('GallerySection', () => {
  describe('Rendering', () => {
    it('should render the gallery section container', () => {
      render(<GallerySection pictorials={[]} isLoading={false} />);

      expect(screen.getByTestId('gallery-section')).toBeInTheDocument();
    });

    it('should render section heading', () => {
      render(<GallerySection pictorials={[]} isLoading={false} />);

      expect(screen.getByText(/내 화보/i)).toBeInTheDocument();
    });

    it('should have section landmark role', () => {
      render(<GallerySection pictorials={[]} isLoading={false} />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render skeleton loaders when isLoading is true', () => {
      render(<GallerySection pictorials={[]} isLoading={true} />);

      const skeletons = screen.getAllByTestId(/skeleton/);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render multiple skeleton cards for loading state', () => {
      render(<GallerySection pictorials={[]} isLoading={true} />);

      const skeletons = screen.getAllByTestId('gallery-skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });

    it('should not render pictorial cards when loading', () => {
      const pictorials = [createMockPictorial()];
      render(<GallerySection pictorials={pictorials} isLoading={true} />);

      expect(screen.queryByTestId('pictorial-card')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no pictorials and not loading', () => {
      render(<GallerySection pictorials={[]} isLoading={false} />);

      expect(screen.getByTestId('empty-gallery-state')).toBeInTheDocument();
    });

    it('should display empty message', () => {
      render(<GallerySection pictorials={[]} isLoading={false} />);

      expect(screen.getByText(/아직 완성된 화보가 없어요/i)).toBeInTheDocument();
    });

    it('should not render grid when showing empty state', () => {
      render(<GallerySection pictorials={[]} isLoading={false} />);

      expect(screen.queryByTestId('gallery-grid')).not.toBeInTheDocument();
    });
  });

  describe('Pictorials Display', () => {
    it('should render pictorial cards when data is available', () => {
      const pictorials = [
        createMockPictorial({ id: 'p1', projectId: 'proj-1' }),
        createMockPictorial({ id: 'p2', projectId: 'proj-2' }),
      ];
      render(<GallerySection pictorials={pictorials} isLoading={false} />);

      const cards = screen.getAllByTestId('pictorial-card');
      expect(cards).toHaveLength(2);
    });

    it('should pass correct pictorial data to each card', () => {
      const pictorials = [
        createMockPictorial({ id: 'p1', projectName: 'Wedding A' }),
        createMockPictorial({ id: 'p2', projectName: 'Wedding B' }),
      ];
      render(<GallerySection pictorials={pictorials} isLoading={false} />);

      expect(screen.getByText('Wedding A')).toBeInTheDocument();
      expect(screen.getByText('Wedding B')).toBeInTheDocument();
    });

    it('should not render empty state when pictorials exist', () => {
      const pictorials = [createMockPictorial()];
      render(<GallerySection pictorials={pictorials} isLoading={false} />);

      expect(screen.queryByTestId('empty-gallery-state')).not.toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('should render pictorials in a grid container', () => {
      const pictorials = [createMockPictorial()];
      render(<GallerySection pictorials={pictorials} isLoading={false} />);

      const grid = screen.getByTestId('gallery-grid');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive grid classes', () => {
      const pictorials = [createMockPictorial()];
      render(<GallerySection pictorials={pictorials} isLoading={false} />);

      const grid = screen.getByTestId('gallery-grid');
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('md:grid-cols-3');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    it('should have proper gap between items', () => {
      const pictorials = [createMockPictorial()];
      render(<GallerySection pictorials={pictorials} isLoading={false} />);

      const grid = screen.getByTestId('gallery-grid');
      expect(grid).toHaveClass('gap-4');
      expect(grid).toHaveClass('md:gap-6');
    });
  });

  describe('Props - className', () => {
    it('should apply custom className to container', () => {
      render(<GallerySection pictorials={[]} isLoading={false} className="custom-class" />);

      const container = screen.getByTestId('gallery-section');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible section heading', () => {
      render(<GallerySection pictorials={[]} isLoading={false} />);

      const heading = screen.getByRole('heading', { name: /내 화보/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have aria-labelledby linking section to heading', () => {
      render(<GallerySection pictorials={[]} isLoading={false} />);

      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby');
    });
  });
});
