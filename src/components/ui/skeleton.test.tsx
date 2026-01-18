import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('should render a skeleton element', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should have default animate-pulse class', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should have default rounded-md class', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('should have default background color class', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('bg-muted');
    });
  });

  describe('Props - className', () => {
    it('should apply custom className', () => {
      render(<Skeleton data-testid="skeleton" className="w-full h-4" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('w-full');
      expect(skeleton).toHaveClass('h-4');
    });

    it('should merge custom className with default classes', () => {
      render(<Skeleton data-testid="skeleton" className="w-full" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('w-full');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should allow overriding rounded class', () => {
      render(<Skeleton data-testid="skeleton" className="rounded-full" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-full');
    });
  });

  describe('Props - variant', () => {
    it('should apply circular variant styling', () => {
      render(<Skeleton data-testid="skeleton" variant="circular" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should apply text variant styling', () => {
      render(<Skeleton data-testid="skeleton" variant="text" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
      expect(skeleton).toHaveClass('rounded-sm');
    });

    it('should apply rectangular variant styling (default)', () => {
      render(<Skeleton data-testid="skeleton" variant="rectangular" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('should default to rectangular variant', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-md');
    });
  });

  describe('Props - HTML attributes', () => {
    it('should pass through HTML div attributes', () => {
      render(<Skeleton data-testid="skeleton" id="my-skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('id', 'my-skeleton');
    });

    it('should support aria attributes for accessibility', () => {
      render(<Skeleton data-testid="skeleton" aria-label="Loading content" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('Accessibility', () => {
    it('should be decorative by default (no semantic role)', () => {
      render(<Skeleton data-testid="skeleton" />);
      const skeleton = screen.getByTestId('skeleton');
      // By default, div elements don't have a role
      expect(skeleton.tagName).toBe('DIV');
    });

    it('should allow adding role="status" for screen readers', () => {
      render(<Skeleton data-testid="skeleton" role="status" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
    });
  });

  describe('Layout Integration', () => {
    it('should work with width and height classes', () => {
      render(<Skeleton data-testid="skeleton" className="w-[200px] h-[100px]" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('w-[200px]');
      expect(skeleton).toHaveClass('h-[100px]');
    });

    it('should work with aspect-ratio classes', () => {
      render(<Skeleton data-testid="skeleton" className="aspect-square w-full" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('aspect-square');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to the underlying element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Skeleton ref={ref} data-testid="skeleton" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct element when accessed via ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Skeleton ref={ref} data-testid="skeleton" />);
      expect(ref.current).toBe(screen.getByTestId('skeleton'));
    });
  });

  describe('Extended Accessibility', () => {
    it('should support aria-busy for loading state', () => {
      render(<Skeleton data-testid="skeleton" aria-busy="true" />);
      expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-busy', 'true');
    });

    it('should support aria-hidden when needed', () => {
      render(<Skeleton data-testid="skeleton" aria-hidden="true" />);
      expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Variant and className interaction', () => {
    it('should apply both variant and custom classes', () => {
      render(<Skeleton data-testid="skeleton" variant="circular" className="bg-red-500" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveClass('bg-red-500');
    });

    it('should allow className to extend variant styles', () => {
      render(<Skeleton data-testid="skeleton" variant="text" className="bg-primary/20" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
      expect(skeleton).toHaveClass('bg-primary/20');
    });
  });
});
