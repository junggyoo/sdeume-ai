import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieGeneratorBtn } from '../components/MovieGeneratorBtn';

describe('MovieGeneratorBtn', () => {
  const defaultProps = {
    onClick: vi.fn(),
    disabled: false,
    isSupported: true,
  };

  it('should render button with correct text', () => {
    render(<MovieGeneratorBtn {...defaultProps} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/무비 영상 만들기/i)).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<MovieGeneratorBtn {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<MovieGeneratorBtn {...defaultProps} disabled={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<MovieGeneratorBtn {...defaultProps} onClick={onClick} disabled={true} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should show unsupported message when isSupported is false', () => {
    render(<MovieGeneratorBtn {...defaultProps} isSupported={false} />);

    expect(screen.getByText(/지원하지 않습니다/i)).toBeInTheDocument();
  });

  it('should be disabled when isSupported is false', () => {
    render(<MovieGeneratorBtn {...defaultProps} isSupported={false} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should have proper accessibility attributes', () => {
    render(<MovieGeneratorBtn {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
