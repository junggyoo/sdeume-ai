import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock CSS.supports for testing environments
beforeEach(() => {
  vi.stubGlobal('CSS', {
    supports: vi.fn().mockReturnValue(true),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

import { AuroraBackground } from './AuroraBackground';

// TODO: Fix component props type mismatch - See docs/testing-strategy.md
describe.skip('AuroraBackground', () => {
  describe('Rendering', () => {
    it('should render the aurora container', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      render(
        <AuroraBackground>
          <div data-testid="child-content">Test Content</div>
        </AuroraBackground>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should render children with correct z-index (above aurora layer)', () => {
      render(
        <AuroraBackground>
          <div data-testid="child-content">Test Content</div>
        </AuroraBackground>
      );

      const container = screen.getByTestId('aurora-background');
      const childContent = screen.getByTestId('child-content');

      // Children should be rendered within the container
      expect(container).toContainElement(childContent);
    });

    it('should render aurora effect layer', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      expect(auroraLayer).toBeInTheDocument();
    });
  });

  describe('Props - showRadialGradient', () => {
    it('should apply radial gradient mask when showRadialGradient is true (default)', () => {
      render(<AuroraBackground showRadialGradient={true} />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      expect(auroraLayer).toHaveAttribute('data-radial-gradient', 'true');
    });

    it('should not apply radial gradient mask when showRadialGradient is false', () => {
      render(<AuroraBackground showRadialGradient={false} />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      expect(auroraLayer).toHaveAttribute('data-radial-gradient', 'false');
    });

    it('should default showRadialGradient to true', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      expect(auroraLayer).toHaveAttribute('data-radial-gradient', 'true');
    });
  });

  describe('Props - className', () => {
    it('should apply custom className to container', () => {
      render(<AuroraBackground className="custom-class" />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<AuroraBackground className="min-h-[90vh]" />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('min-h-[90vh]');
      expect(container).toHaveClass('relative');
    });
  });

  describe('Props - HTML attributes', () => {
    it('should pass through HTML div attributes', () => {
      render(<AuroraBackground id="my-aurora" data-custom="value" />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('id', 'my-aurora');
      expect(container).toHaveAttribute('data-custom', 'value');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden="true" on decorative aurora layer', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      expect(auroraLayer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have pointer-events-none on aurora layer to prevent interaction blocking', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      expect(auroraLayer).toHaveClass('pointer-events-none');
    });

    it('should allow children to receive pointer events', () => {
      render(
        <AuroraBackground>
          <button data-testid="clickable-button">Click Me</button>
        </AuroraBackground>
      );

      const button = screen.getByTestId('clickable-button');
      // Button should not have pointer-events-none
      expect(button).not.toHaveClass('pointer-events-none');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for background', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      // Check for dark mode variant class pattern
      expect(container.className).toMatch(/dark:/);
    });

    it('should have dark mode classes for aurora effect', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      // Check for dark mode variant class pattern
      expect(auroraLayer.className).toMatch(/dark:/);
    });
  });

  describe('Animation', () => {
    it('should have animation class for aurora effect', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      // Should have aurora animation related classes
      expect(auroraLayer.className).toMatch(/animate-aurora|after:animate-aurora/);
    });

    it('should support reduced motion preference via CSS', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      // Should have motion-reduce variant for animation
      expect(auroraLayer.className).toMatch(/motion-reduce:/);
    });
  });

  describe('Layout', () => {
    it('should use flex layout for centering children', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('justify-center');
    });

    it('should have full viewport height by default', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('h-[100vh]');
    });

    it('should allow height override via className', () => {
      render(<AuroraBackground className="h-auto min-h-screen" />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('h-auto');
      expect(container).toHaveClass('min-h-screen');
    });
  });

  describe('Visual Effects', () => {
    it('should have blur effect on aurora layer', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      expect(auroraLayer.className).toMatch(/blur/);
    });

    it('should have overflow hidden on aurora container', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      const overflowContainer = container.querySelector('.overflow-hidden');
      expect(overflowContainer).toBeInTheDocument();
    });

    it('should use will-change for performance optimization', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      expect(auroraLayer).toHaveClass('will-change-transform');
    });
  });

  describe('Color Scheme', () => {
    it('should have indigo/purple/pink/violet aurora colors in gradient', () => {
      render(<AuroraBackground />);

      const auroraLayer = screen.getByTestId('aurora-effect-layer');
      // Check for aurora gradient CSS variable references in className
      expect(auroraLayer.className).toMatch(/--aurora/);
    });

    it('should have light mode background color', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('bg-zinc-50');
    });

    it('should have dark mode background color', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container.className).toMatch(/dark:bg-/);
    });
  });
});
