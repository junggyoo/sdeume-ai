import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoviePreviewModal } from '../components/MoviePreviewModal';

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
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  };
});

describe('MoviePreviewModal', () => {
  const defaultProps = {
    isOpen: true,
    videoUrl: 'blob:mock-video-url',
    onClose: vi.fn(),
    onDownload: vi.fn(),
  };

  it('should render when isOpen is true', () => {
    render(<MoviePreviewModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<MoviePreviewModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display video element with correct src', () => {
    render(<MoviePreviewModal {...defaultProps} />);

    const video = screen.getByTestId('preview-video');
    expect(video).toHaveAttribute('src', 'blob:mock-video-url');
  });

  it('should call onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    render(<MoviePreviewModal {...defaultProps} onDownload={onDownload} />);

    fireEvent.click(screen.getByRole('button', { name: /다운로드/i }));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<MoviePreviewModal {...defaultProps} onClose={onClose} />);

    // Find all close buttons and click the one in the footer (not the X button)
    const closeButtons = screen.getAllByRole('button', { name: /닫기/i });
    fireEvent.click(closeButtons[closeButtons.length - 1]); // Click the footer button

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<MoviePreviewModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    render(<MoviePreviewModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('should not render video when videoUrl is null', () => {
    render(<MoviePreviewModal {...defaultProps} videoUrl={null} />);

    expect(screen.queryByTestId('preview-video')).not.toBeInTheDocument();
  });
});
