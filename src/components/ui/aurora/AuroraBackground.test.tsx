import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
let mockReducedMotion = false;
vi.mock('framer-motion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));

// Mock IntersectionObserver
let mockIsIntersecting = true;
const mockIntersectionObserver = vi.fn();

beforeEach(() => {
  mockReducedMotion = false;
  mockIsIntersecting = true;

  mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
    // Immediately invoke the callback with mocked entry
    setTimeout(() => {
      callback(
        [{ isIntersecting: mockIsIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }, 0);
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
  });

  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// Import component after mocks
import { AuroraBackground } from './AuroraBackground';

describe('AuroraBackground', () => {
  describe('Rendering', () => {
    it('should render the aurora container', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toBeInTheDocument();
    });

    it('should render aurora layers', () => {
      render(<AuroraBackground />);

      const layers = screen.getAllByTestId(/^aurora-layer-/);
      expect(layers.length).toBeGreaterThanOrEqual(4);
    });

    it('should render children when provided', () => {
      render(
        <AuroraBackground>
          <div data-testid="child-content">Test Content</div>
        </AuroraBackground>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('Props - intensity', () => {
    it('should apply low intensity (0.3) with reduced opacity', () => {
      render(<AuroraBackground intensity={0.3} />);

      const container = screen.getByTestId('aurora-background');
      // Intensity 0.3 should result in reduced opacity on layers
      expect(container).toHaveAttribute('data-intensity', '0.3');
    });

    it('should apply high intensity (1.0) with full opacity', () => {
      render(<AuroraBackground intensity={1.0} />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('data-intensity', '1');
    });

    it('should use default intensity (0.5) when not provided', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('data-intensity', '0.5');
    });
  });

  describe('Props - hue', () => {
    it('should apply classic hue colors', () => {
      render(<AuroraBackground hue="classic" />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('data-hue', 'classic');
    });

    it('should apply romantic hue colors (Indigo/Purple/Pink/Violet)', () => {
      render(<AuroraBackground hue="romantic" />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('data-hue', 'romantic');
    });

    it('should use romantic as default hue', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('data-hue', 'romantic');
    });
  });

  describe('Props - spotlight', () => {
    it('should apply spotlight mask when enabled', () => {
      render(<AuroraBackground spotlight />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('data-spotlight', 'true');
    });

    it('should position spotlight at custom position', () => {
      render(
        <AuroraBackground
          spotlight
          spotlightPosition={{ x: 30, y: 70 }}
        />
      );

      const container = screen.getByTestId('aurora-background');
      expect(container.style.getPropertyValue('--spotlight-x')).toBe('30%');
      expect(container.style.getPropertyValue('--spotlight-y')).toBe('70%');
    });

    it('should use center position (50%, 50%) as default when spotlight is enabled', () => {
      render(<AuroraBackground spotlight />);

      const container = screen.getByTestId('aurora-background');
      expect(container.style.getPropertyValue('--spotlight-x')).toBe('50%');
      expect(container.style.getPropertyValue('--spotlight-y')).toBe('50%');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden="true" for decorative content', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have pointer-events-none to prevent interaction blocking', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('pointer-events-none');
    });

    it('should respect prefers-reduced-motion', async () => {
      mockReducedMotion = true;

      // Re-import to get fresh mock state
      vi.resetModules();
      const { AuroraBackground: FreshAurora } = await import('./AuroraBackground');

      render(<FreshAurora />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('data-reduced-motion', 'true');
    });

    it('should disable animation when disableAnimation prop is true', () => {
      render(<AuroraBackground disableAnimation />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveAttribute('data-animated', 'false');
    });
  });

  describe('IntersectionObserver - Viewport Awareness', () => {
    it('should animate when in viewport', async () => {
      mockIsIntersecting = true;

      render(<AuroraBackground />);

      // Wait for IntersectionObserver callback
      await vi.waitFor(() => {
        const container = screen.getByTestId('aurora-background');
        expect(container).toHaveAttribute('data-in-view', 'true');
      });
    });

    it('should pause animation when out of viewport', async () => {
      mockIsIntersecting = false;

      render(<AuroraBackground />);

      await vi.waitFor(() => {
        const container = screen.getByTestId('aurora-background');
        expect(container).toHaveAttribute('data-in-view', 'false');
      });
    });
  });

  describe('CSS Custom Properties', () => {
    it('should set animation duration CSS variable', () => {
      render(<AuroraBackground />);

      const container = screen.getByTestId('aurora-background');
      // Default 90s slow wave animation
      expect(container.style.getPropertyValue('--aurora-duration')).toBe('90s');
    });

    it('should apply custom className', () => {
      render(<AuroraBackground className="custom-class" />);

      const container = screen.getByTestId('aurora-background');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Romantic Tech Colors', () => {
    it('should render Indigo layer for romantic hue', () => {
      render(<AuroraBackground hue="romantic" />);

      const indigoLayer = screen.getByTestId('aurora-layer-indigo');
      expect(indigoLayer).toBeInTheDocument();
    });

    it('should render Purple layer for romantic hue', () => {
      render(<AuroraBackground hue="romantic" />);

      const purpleLayer = screen.getByTestId('aurora-layer-purple');
      expect(purpleLayer).toBeInTheDocument();
    });

    it('should render Pink layer for romantic hue', () => {
      render(<AuroraBackground hue="romantic" />);

      const pinkLayer = screen.getByTestId('aurora-layer-pink');
      expect(pinkLayer).toBeInTheDocument();
    });

    it('should render Violet layer for romantic hue', () => {
      render(<AuroraBackground hue="romantic" />);

      const violetLayer = screen.getByTestId('aurora-layer-violet');
      expect(violetLayer).toBeInTheDocument();
    });
  });
});
