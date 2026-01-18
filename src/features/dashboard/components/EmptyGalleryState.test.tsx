import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyGalleryState } from './EmptyGalleryState';

describe('EmptyGalleryState', () => {
  describe('Rendering', () => {
    it('should render the empty state container', () => {
      render(<EmptyGalleryState />);

      expect(screen.getByTestId('empty-gallery-state')).toBeInTheDocument();
    });

    it('should render default empty message', () => {
      render(<EmptyGalleryState />);

      expect(screen.getByText(/아직 완성된 화보가 없어요/i)).toBeInTheDocument();
    });

    it('should render default subtitle', () => {
      render(<EmptyGalleryState />);

      expect(screen.getByText(/첫 번째 화보를 생성해보세요/i)).toBeInTheDocument();
    });

    it('should render an illustration or icon', () => {
      render(<EmptyGalleryState />);

      expect(screen.getByTestId('empty-illustration')).toBeInTheDocument();
    });
  });

  describe('Props - message', () => {
    it('should display custom message when provided', () => {
      render(<EmptyGalleryState message="커스텀 메시지입니다" />);

      expect(screen.getByText('커스텀 메시지입니다')).toBeInTheDocument();
    });

    it('should display default message when message prop is not provided', () => {
      render(<EmptyGalleryState />);

      expect(screen.getByText(/아직 완성된 화보가 없어요/i)).toBeInTheDocument();
    });
  });

  describe('Props - className', () => {
    it('should apply custom className', () => {
      render(<EmptyGalleryState className="custom-class" />);

      const container = screen.getByTestId('empty-gallery-state');
      expect(container).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<EmptyGalleryState className="bg-red-500" />);

      const container = screen.getByTestId('empty-gallery-state');
      expect(container).toHaveClass('bg-red-500');
    });
  });

  describe('Styling', () => {
    it('should center content', () => {
      render(<EmptyGalleryState />);

      const container = screen.getByTestId('empty-gallery-state');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('justify-center');
    });

    it('should have proper padding', () => {
      render(<EmptyGalleryState />);

      const container = screen.getByTestId('empty-gallery-state');
      expect(container.className).toMatch(/p-/);
    });

    it('should have muted text color for message', () => {
      render(<EmptyGalleryState />);

      const container = screen.getByTestId('empty-gallery-state');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should stack elements vertically', () => {
      render(<EmptyGalleryState />);

      const container = screen.getByTestId('empty-gallery-state');
      expect(container).toHaveClass('flex-col');
    });

    it('should have proper spacing between elements', () => {
      render(<EmptyGalleryState />);

      const container = screen.getByTestId('empty-gallery-state');
      expect(container.className).toMatch(/gap-|space-y-/);
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for empty state notification', () => {
      render(<EmptyGalleryState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have appropriate aria-label', () => {
      render(<EmptyGalleryState />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label');
    });
  });
});
