import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RerollButton } from '../components/RerollButton';

describe('RerollButton', () => {
  const defaultProps = {};

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render with correct text', () => {
      render(<RerollButton {...defaultProps} />);

      expect(screen.getByText(/아쉬운 사진 다시 찍기/)).toBeInTheDocument();
    });

    it('should show remaining count badge with default value 1', () => {
      render(<RerollButton {...defaultProps} />);

      expect(screen.getByTestId('reroll-badge')).toBeInTheDocument();
      expect(screen.getByText('1회 무료')).toBeInTheDocument();
    });

    it('should show custom remaining count', () => {
      render(<RerollButton remainingCount={3} />);

      expect(screen.getByText('3회 무료')).toBeInTheDocument();
    });

    it('should show 0 remaining count', () => {
      render(<RerollButton remainingCount={0} />);

      expect(screen.getByText('0회 무료')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<RerollButton {...defaultProps} />);

      expect(screen.getByTestId('reroll-button').tagName).toBe('BUTTON');
    });
  });

  describe('Interactions', () => {
    it('should show alert on click', () => {
      render(<RerollButton {...defaultProps} />);

      fireEvent.click(screen.getByTestId('reroll-button'));

      expect(window.alert).toHaveBeenCalledWith('준비 중입니다');
    });

    it('should show alert with correct message', () => {
      render(<RerollButton {...defaultProps} />);

      fireEvent.click(screen.getByTestId('reroll-button'));

      expect(window.alert).toHaveBeenCalledTimes(1);
      expect(window.alert).toHaveBeenCalledWith('준비 중입니다');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<RerollButton disabled={true} />);

      expect(screen.getByTestId('reroll-button')).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      render(<RerollButton {...defaultProps} />);

      expect(screen.getByTestId('reroll-button')).not.toBeDisabled();
    });

    it('should not trigger alert when disabled', () => {
      render(<RerollButton disabled={true} />);

      fireEvent.click(screen.getByTestId('reroll-button'));

      expect(window.alert).not.toHaveBeenCalled();
    });

    it('should have disabled visual style', () => {
      render(<RerollButton disabled={true} />);

      const button = screen.getByTestId('reroll-button');
      // disabled 상태의 스타일 확인
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Styling', () => {
    it('should have rose gold colored badge', () => {
      render(<RerollButton {...defaultProps} />);

      const badge = screen.getByTestId('reroll-badge');
      // Badge 스타일 확인 (bg-accent-rose/10 또는 유사한 클래스)
      expect(badge).toHaveClass('text-accent-rose');
    });

    it('should apply custom className', () => {
      render(<RerollButton className="custom-reroll" />);

      expect(screen.getByTestId('reroll-button')).toHaveClass('custom-reroll');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<RerollButton {...defaultProps} />);

      expect(screen.getByTestId('reroll-button')).toHaveAttribute(
        'aria-label',
        '사진 다시 찍기'
      );
    });

    it('should indicate disabled state for screen readers', () => {
      render(<RerollButton disabled={true} />);

      expect(screen.getByTestId('reroll-button')).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });
  });
});
