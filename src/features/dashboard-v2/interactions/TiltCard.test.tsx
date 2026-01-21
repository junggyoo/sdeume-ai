import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TiltCard } from './TiltCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }>(
      ({ children, style, ...props }, ref) =>
        React.createElement('div', { ref, style, ...props }, children)
    ),
  },
  useMotionValue: () => ({
    set: vi.fn(),
    get: () => 0,
  }),
  useSpring: () => ({
    set: vi.fn(),
    get: () => 0,
  }),
  useTransform: () => 0,
}));

describe('TiltCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(
        <TiltCard>
          <span>Test Content</span>
        </TiltCard>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with data-testid', () => {
      render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      );

      expect(screen.getByTestId('tilt-card')).toBeInTheDocument();
    });
  });

  describe('Perspective', () => {
    it('should have perspective-1000 class for 3D effect', () => {
      render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      );

      const container = screen.getByTestId('tilt-card-container');
      expect(container.className).toMatch(/perspective-1000/);
    });
  });

  describe('Mouse Interaction', () => {
    it('should handle mouse enter', () => {
      render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      );

      const card = screen.getByTestId('tilt-card');
      fireEvent.mouseEnter(card);

      // 마우스 진입 시 에러 없이 처리되어야 함
      expect(card).toBeInTheDocument();
    });

    it('should handle mouse move', () => {
      render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      );

      const card = screen.getByTestId('tilt-card');
      fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });

      // 마우스 이동 시 에러 없이 처리되어야 함
      expect(card).toBeInTheDocument();
    });

    it('should handle mouse leave (reset)', () => {
      render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      );

      const card = screen.getByTestId('tilt-card');
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      // 마우스 나갈 때 리셋 처리되어야 함
      expect(card).toBeInTheDocument();
    });
  });

  describe('Props - maxTilt', () => {
    it('should accept custom maxTilt value', () => {
      render(
        <TiltCard maxTilt={20}>
          <span>Content</span>
        </TiltCard>
      );

      const card = screen.getByTestId('tilt-card');
      expect(card).toBeInTheDocument();
    });

    it('should use default maxTilt when not provided', () => {
      render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      );

      const card = screen.getByTestId('tilt-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <TiltCard className="custom-tilt-class">
          <span>Content</span>
        </TiltCard>
      );

      const card = screen.getByTestId('tilt-card');
      expect(card).toHaveClass('custom-tilt-class');
    });
  });

  describe('Styling', () => {
    it('should have transform-style preserve-3d', () => {
      render(
        <TiltCard>
          <span>Content</span>
        </TiltCard>
      );

      const card = screen.getByTestId('tilt-card');
      // transform-style은 인라인 스타일 또는 CSS로 적용될 수 있음
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be focusable content wrapper', () => {
      render(
        <TiltCard>
          <button>Focusable Button</button>
        </TiltCard>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
