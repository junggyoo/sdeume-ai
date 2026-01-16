import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieProcessingModal } from '../components/MovieProcessingModal';

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(
        (
          { children, ...props }: React.PropsWithChildren<object>,
          ref: React.Ref<HTMLDivElement>
        ) => React.createElement('div', { ...props, ref }, children)
      ),
      p: React.forwardRef(
        (
          { children, ...props }: React.PropsWithChildren<object>,
          ref: React.Ref<HTMLParagraphElement>
        ) => React.createElement('p', { ...props, ref }, children)
      ),
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  };
});

describe('MovieProcessingModal', () => {
  const defaultProps = {
    isOpen: true,
    progress: 50,
    onCancel: vi.fn(),
  };

  it('should render when isOpen is true', () => {
    render(<MovieProcessingModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<MovieProcessingModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display progress percentage', () => {
    render(<MovieProcessingModal {...defaultProps} progress={75} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should display progress bar with correct width', () => {
    render(<MovieProcessingModal {...defaultProps} progress={60} />);

    const progressBar = screen.getByTestId('progress-bar-fill');
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<MovieProcessingModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /취소/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should display rotating messages', () => {
    render(<MovieProcessingModal {...defaultProps} />);

    // Should have some processing message (at least one exists)
    const messages = screen.getAllByText(/영상|장면|편집|사진/i);
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should have proper accessibility attributes', () => {
    render(<MovieProcessingModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });
});
