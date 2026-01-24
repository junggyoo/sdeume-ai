import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuroraBackground } from './AuroraBackground';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div className={className} {...props}>{children}</div>,
  },
}));

describe('AuroraBackground', () => {
  describe('Rendering', () => {
    it('should render the aurora container', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toBeInTheDocument();
    });

    it('should render aurora effect blobs', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      // Should have 3 animated blob divs
      const blobs = container.querySelectorAll('.blur-\\[100px\\]');
      expect(blobs).toHaveLength(3);
    });
  });

  describe('Layout', () => {
    it('should be fixed positioned', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('fixed');
      expect(container).toHaveClass('inset-0');
    });

    it('should have z-0 for layering below content', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('z-0');
    });
  });

  describe('Accessibility', () => {
    it('should have pointer-events-none to not block interactions', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('pointer-events-none');
    });

    it('should have overflow hidden to contain blur effects', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('overflow-hidden');
    });
  });

  describe('Visual Effects', () => {
    it('should have purple aurora blob', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      const purpleBlob = container.querySelector('.bg-purple-100\\/40');
      expect(purpleBlob).toBeInTheDocument();
    });

    it('should have blue aurora blob', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      const blueBlob = container.querySelector('.bg-blue-100\\/40');
      expect(blueBlob).toBeInTheDocument();
    });

    it('should have pink aurora blob', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      const pinkBlob = container.querySelector('.bg-pink-100\\/30');
      expect(pinkBlob).toBeInTheDocument();
    });

    it('should have blur effect on all blobs', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      const blurredElements = container.querySelectorAll('.blur-\\[100px\\]');
      expect(blurredElements).toHaveLength(3);
    });
  });
});
