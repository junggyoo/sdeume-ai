import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PictorialCard } from './PictorialCard';
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
    { url: 'https://example.com/image3.jpg', is_blur: false },
  ],
  completedAt: '2024-01-15T12:00:00Z',
  createdAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('PictorialCard', () => {
  describe('Rendering', () => {
    it('should render the card container', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} />);

      expect(screen.getByTestId('pictorial-card')).toBeInTheDocument();
    });

    it('should render as a link', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should link to reveal page with project id', () => {
      const pictorial = createMockPictorial({ projectId: 'project-123' });
      render(<PictorialCard pictorial={pictorial} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/reveal/project-123');
    });
  });

  describe('Thumbnail', () => {
    it('should render thumbnail image', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
    });

    it('should use first image as thumbnail', () => {
      const pictorial = createMockPictorial({
        images: [
          { url: 'https://example.com/first.jpg', is_blur: false },
          { url: 'https://example.com/second.jpg', is_blur: false },
        ],
      });
      render(<PictorialCard pictorial={pictorial} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/first.jpg');
    });

    it('should have alt text with project name', () => {
      const pictorial = createMockPictorial({ projectName: 'Wedding Day' });
      render(<PictorialCard pictorial={pictorial} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', expect.stringContaining('Wedding Day'));
    });

    it('should handle null project name in alt text', () => {
      const pictorial = createMockPictorial({ projectName: null });
      render(<PictorialCard pictorial={pictorial} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt');
    });
  });

  describe('Photo Count Badge', () => {
    it('should display photo count', () => {
      const pictorial = createMockPictorial({
        images: [
          { url: 'url1', is_blur: false },
          { url: 'url2', is_blur: false },
          { url: 'url3', is_blur: false },
        ],
      });
      render(<PictorialCard pictorial={pictorial} />);

      expect(screen.getByText('3장')).toBeInTheDocument();
    });

    it('should display correct count for single image', () => {
      const pictorial = createMockPictorial({
        images: [{ url: 'url1', is_blur: false }],
      });
      render(<PictorialCard pictorial={pictorial} />);

      expect(screen.getByText('1장')).toBeInTheDocument();
    });

    it('should have badge styling', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} />);

      const badge = screen.getByTestId('photo-count-badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Project Name', () => {
    it('should display project name when available', () => {
      const pictorial = createMockPictorial({ projectName: 'Summer Wedding' });
      render(<PictorialCard pictorial={pictorial} />);

      expect(screen.getByText('Summer Wedding')).toBeInTheDocument();
    });

    it('should display theme display name when project name is null', () => {
      const pictorial = createMockPictorial({
        projectName: null,
        themeDisplayNameKo: '클래식',
      });
      render(<PictorialCard pictorial={pictorial} />);

      expect(screen.getByText('클래식')).toBeInTheDocument();
    });

    it('should display fallback text when both names are null', () => {
      const pictorial = createMockPictorial({
        projectName: null,
        themeDisplayNameKo: null,
      });
      render(<PictorialCard pictorial={pictorial} />);

      expect(screen.getByText(/화보|사진/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have rounded corners', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} />);

      const card = screen.getByTestId('pictorial-card');
      expect(card.className).toMatch(/rounded/);
    });

    it('should have hover effect classes', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} />);

      const card = screen.getByTestId('pictorial-card');
      expect(card.className).toMatch(/hover:/);
    });

    it('should have overflow hidden for image container', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} />);

      const card = screen.getByTestId('pictorial-card');
      expect(card.className).toMatch(/overflow-hidden/);
    });

    it('should have aspect ratio for consistent sizing', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} />);

      const imageContainer = screen.getByTestId('image-container');
      expect(imageContainer.className).toMatch(/aspect-/);
    });
  });

  describe('Props - className', () => {
    it('should apply custom className', () => {
      const pictorial = createMockPictorial();
      render(<PictorialCard pictorial={pictorial} className="custom-class" />);

      const card = screen.getByTestId('pictorial-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible link text', () => {
      const pictorial = createMockPictorial({ projectName: 'Beach Wedding' });
      render(<PictorialCard pictorial={pictorial} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty images array gracefully', () => {
      const pictorial = createMockPictorial({ images: [] });
      render(<PictorialCard pictorial={pictorial} />);

      expect(screen.getByTestId('pictorial-card')).toBeInTheDocument();
      expect(screen.getByText('0장')).toBeInTheDocument();
    });

    it('should use thumbnail_url when available', () => {
      const pictorial = createMockPictorial({
        images: [
          { url: 'https://example.com/full.jpg', is_blur: false, thumbnail_url: 'https://example.com/thumb.jpg' },
        ],
      });
      render(<PictorialCard pictorial={pictorial} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });
  });
});
