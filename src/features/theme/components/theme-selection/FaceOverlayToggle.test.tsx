import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FaceOverlayToggle } from './FaceOverlayToggle';

describe('FaceOverlayToggle', () => {
  describe('default variant', () => {
    it('should render toggle button with label', () => {
      render(<FaceOverlayToggle enabled={false} onToggle={() => {}} />);

      expect(screen.getByText('내 얼굴 적용')).toBeInTheDocument();
    });

    it('should render Eye icon', () => {
      render(<FaceOverlayToggle enabled={false} onToggle={() => {}} />);

      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should call onToggle when clicked', () => {
      const handleToggle = vi.fn();
      render(<FaceOverlayToggle enabled={false} onToggle={handleToggle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('should show enabled state with amber accent when enabled', () => {
      render(<FaceOverlayToggle enabled={true} onToggle={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-amber-400/20');
      expect(button).toHaveClass('text-amber-400');
    });

    it('should show disabled state with white/60 when disabled', () => {
      render(<FaceOverlayToggle enabled={false} onToggle={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/10');
      expect(button).toHaveClass('text-white/60');
    });
  });

  describe('fab variant', () => {
    it('should render as floating action button without label', () => {
      render(
        <FaceOverlayToggle enabled={false} onToggle={() => {}} variant="fab" />
      );

      expect(screen.queryByText('내 얼굴 적용')).not.toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should have fixed positioning classes', () => {
      render(
        <FaceOverlayToggle enabled={false} onToggle={() => {}} variant="fab" />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('fixed');
      expect(button).toHaveClass('bottom-24');
      expect(button).toHaveClass('right-4');
    });

    it('should have rounded-full class for circular shape', () => {
      render(
        <FaceOverlayToggle enabled={false} onToggle={() => {}} variant="fab" />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
    });

    it('should have shadow for elevation', () => {
      render(
        <FaceOverlayToggle enabled={false} onToggle={() => {}} variant="fab" />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('shadow-lg');
    });
  });

  describe('header variant', () => {
    it('should render Wand2 icon', () => {
      render(
        <FaceOverlayToggle
          enabled={false}
          onToggle={() => {}}
          variant="header"
        />
      );

      expect(screen.getByTestId('wand-icon')).toBeInTheDocument();
    });

    it('should not render Eye icon', () => {
      render(
        <FaceOverlayToggle
          enabled={false}
          onToggle={() => {}}
          variant="header"
        />
      );

      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('should display "내 얼굴" text when disabled', () => {
      render(
        <FaceOverlayToggle
          enabled={false}
          onToggle={() => {}}
          variant="header"
        />
      );

      expect(screen.getByText('내 얼굴')).toBeInTheDocument();
    });

    it('should display "적용됨" text when enabled', () => {
      render(
        <FaceOverlayToggle
          enabled={true}
          onToggle={() => {}}
          variant="header"
        />
      );

      expect(screen.getByText('적용됨')).toBeInTheDocument();
    });

    it('should have bg-purple-600 when enabled', () => {
      render(
        <FaceOverlayToggle
          enabled={true}
          onToggle={() => {}}
          variant="header"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-purple-600');
    });

    it('should have bg-slate-700 when disabled', () => {
      render(
        <FaceOverlayToggle
          enabled={false}
          onToggle={() => {}}
          variant="header"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-slate-700');
    });

    it('should call onToggle when clicked', () => {
      const handleToggle = vi.fn();
      render(
        <FaceOverlayToggle
          enabled={false}
          onToggle={handleToggle}
          variant="header"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('should have rounded-lg class', () => {
      render(
        <FaceOverlayToggle
          enabled={false}
          onToggle={() => {}}
          variant="header"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg');
    });
  });

  describe('accessibility', () => {
    it('should have accessible button role', () => {
      render(<FaceOverlayToggle enabled={false} onToggle={() => {}} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-pressed attribute reflecting enabled state', () => {
      const { rerender } = render(
        <FaceOverlayToggle enabled={false} onToggle={() => {}} />
      );

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-pressed',
        'false'
      );

      rerender(<FaceOverlayToggle enabled={true} onToggle={() => {}} />);

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });
});
