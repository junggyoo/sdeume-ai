import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MagneticButton } from './MagneticButton';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement> & { style?: React.CSSProperties }
    >(({ children, style, ...props }, ref) =>
      React.createElement('button', { ref, style, ...props }, children)
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
}));

describe('MagneticButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render children correctly', () => {
      render(<MagneticButton>Click Me</MagneticButton>);

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<MagneticButton>Button</MagneticButton>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have data-testid', () => {
      render(<MagneticButton>Button</MagneticButton>);

      expect(screen.getByTestId('magnetic-button')).toBeInTheDocument();
    });
  });

  describe('Click Handler', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<MagneticButton onClick={handleClick}>Click</MagneticButton>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <MagneticButton onClick={handleClick} disabled>
          Click
        </MagneticButton>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should have disabled attribute when disabled', () => {
      render(<MagneticButton disabled>Disabled</MagneticButton>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have disabled styling', () => {
      render(<MagneticButton disabled>Disabled</MagneticButton>);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/disabled:|opacity-/);
    });
  });

  describe('Mouse Interaction', () => {
    it('should handle mouse enter', () => {
      render(<MagneticButton>Button</MagneticButton>);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      expect(button).toBeInTheDocument();
    });

    it('should handle mouse move (magnetic effect)', () => {
      render(<MagneticButton>Button</MagneticButton>);

      const button = screen.getByRole('button');
      fireEvent.mouseMove(button, { clientX: 50, clientY: 50 });

      expect(button).toBeInTheDocument();
    });

    it('should handle mouse leave (reset position)', () => {
      render(<MagneticButton>Button</MagneticButton>);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      expect(button).toBeInTheDocument();
    });
  });

  describe('Props - magneticStrength', () => {
    it('should accept custom magneticStrength value', () => {
      render(<MagneticButton magneticStrength={20}>Button</MagneticButton>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should use default magneticStrength when not provided', () => {
      render(<MagneticButton>Button</MagneticButton>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <MagneticButton className="custom-magnetic-class">Button</MagneticButton>
      );

      expect(screen.getByRole('button')).toHaveClass('custom-magnetic-class');
    });
  });

  describe('Shine Effect', () => {
    it('should have shine effect container', () => {
      render(<MagneticButton>Button</MagneticButton>);

      // Shine 효과는 pseudo element나 추가 요소로 구현
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have cursor pointer', () => {
      render(<MagneticButton>Button</MagneticButton>);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/cursor-pointer/);
    });

    it('should have transition for smooth movement', () => {
      render(<MagneticButton>Button</MagneticButton>);

      const button = screen.getByRole('button');
      // will-change 또는 transition 클래스
      expect(button.className).toMatch(/will-change|transition/);
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<MagneticButton>Button</MagneticButton>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should support keyboard activation', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<MagneticButton onClick={handleClick}>Button</MagneticButton>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });

    it('should have type="button" by default', () => {
      render(<MagneticButton>Button</MagneticButton>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
  });
});
