import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UploadZone } from './UploadZone';
import type { UploadRole } from '../types';

describe('UploadZone', () => {
  const defaultProps = {
    onFilesSelect: vi.fn(),
    photoCount: 5,
    maxPhotos: 20,
    role: 'bride' as UploadRole,
    isProcessing: false,
    processingCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('should render upload zone', () => {
      render(<UploadZone {...defaultProps} />);

      expect(screen.getByTestId('upload-zone')).toBeInTheDocument();
    });

    it('should render gallery button', () => {
      render(<UploadZone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /갤러리/i })).toBeInTheDocument();
    });

    it('should render camera button', () => {
      render(<UploadZone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /카메라/i })).toBeInTheDocument();
    });

    it('should display upload instructions', () => {
      render(<UploadZone {...defaultProps} />);

      expect(screen.getByText(/사진을 선택하거나 드래그/i)).toBeInTheDocument();
    });
  });

  describe('파일 선택', () => {
    it('should call onFilesSelect when files are selected via gallery', () => {
      const onFilesSelect = vi.fn();
      render(<UploadZone {...defaultProps} onFilesSelect={onFilesSelect} />);

      const input = screen.getByTestId('gallery-input');
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      fireEvent.change(input);

      expect(onFilesSelect).toHaveBeenCalled();
    });

    it('should accept image files only', () => {
      render(<UploadZone {...defaultProps} />);

      const galleryInput = screen.getByTestId('gallery-input');
      expect(galleryInput).toHaveAttribute('accept', 'image/*');
    });

    it('should allow multiple file selection', () => {
      render(<UploadZone {...defaultProps} />);

      const input = screen.getByTestId('gallery-input');
      expect(input).toHaveAttribute('multiple');
    });
  });

  describe('카메라 입력', () => {
    it('should have capture attribute on camera input', () => {
      render(<UploadZone {...defaultProps} />);

      const cameraInput = screen.getByTestId('camera-input');
      expect(cameraInput).toHaveAttribute('capture', 'user');
    });

    it('should call onFilesSelect when photo is taken', () => {
      const onFilesSelect = vi.fn();
      render(<UploadZone {...defaultProps} onFilesSelect={onFilesSelect} />);

      const input = screen.getByTestId('camera-input');
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });

      Object.defineProperty(input, 'files', {
        value: [file],
      });

      fireEvent.change(input);

      expect(onFilesSelect).toHaveBeenCalled();
    });
  });

  describe('드래그 앤 드롭', () => {
    it('should highlight on drag enter', () => {
      const { container } = render(<UploadZone {...defaultProps} />);

      const zone = screen.getByTestId('upload-zone');

      fireEvent.dragEnter(zone, {
        dataTransfer: { types: ['Files'] },
      });

      expect(zone).toHaveClass('border-violet-500');
    });

    it('should remove highlight on drag leave', () => {
      render(<UploadZone {...defaultProps} />);

      const zone = screen.getByTestId('upload-zone');

      fireEvent.dragEnter(zone, {
        dataTransfer: { types: ['Files'] },
      });
      fireEvent.dragLeave(zone);

      expect(zone).not.toHaveClass('border-violet-500');
    });

    it('should call onFilesSelect on drop', () => {
      const onFilesSelect = vi.fn();
      render(<UploadZone {...defaultProps} onFilesSelect={onFilesSelect} />);

      const zone = screen.getByTestId('upload-zone');
      const file = new File([''], 'dropped.jpg', { type: 'image/jpeg' });

      fireEvent.drop(zone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      });

      expect(onFilesSelect).toHaveBeenCalled();
    });
  });

  describe('처리 중 상태', () => {
    it('should show processing indicator when isProcessing is true', () => {
      render(<UploadZone {...defaultProps} isProcessing processingCount={3} />);

      expect(screen.getByText(/분석 중/i)).toBeInTheDocument();
    });

    it('should display processing count', () => {
      render(<UploadZone {...defaultProps} isProcessing processingCount={5} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should disable inputs when processing', () => {
      render(<UploadZone {...defaultProps} isProcessing processingCount={3} />);

      const galleryInput = screen.getByTestId('gallery-input');
      expect(galleryInput).toBeDisabled();
    });
  });

  describe('남은 수량 표시', () => {
    it('should display remaining slots', () => {
      render(<UploadZone {...defaultProps} photoCount={12} maxPhotos={20} />);

      expect(screen.getByText(/8장 더 추가 가능/i)).toBeInTheDocument();
    });

    it('should show full message when max reached', () => {
      render(<UploadZone {...defaultProps} photoCount={20} maxPhotos={20} />);

      expect(screen.getByText(/충분히 올렸어요/i)).toBeInTheDocument();
    });
  });

  describe('역할별 메시지', () => {
    it('should display bride-specific message', () => {
      render(<UploadZone {...defaultProps} role="bride" />);

      expect(screen.getByText(/신부/i)).toBeInTheDocument();
    });

    it('should display groom-specific message', () => {
      render(<UploadZone {...defaultProps} role="groom" />);

      expect(screen.getByText(/신랑/i)).toBeInTheDocument();
    });
  });

  describe('다크 모드 스타일', () => {
    it('should have dark border by default', () => {
      render(<UploadZone {...defaultProps} />);

      const zone = screen.getByTestId('upload-zone');
      expect(zone).toHaveClass('border-slate-600');
    });

    it('should have pulsing animation', () => {
      render(<UploadZone {...defaultProps} />);

      const zone = screen.getByTestId('upload-zone');
      expect(zone).toHaveClass('animate-pulse-border');
    });
  });

  describe('접근성', () => {
    it('should have accessible button labels', () => {
      render(<UploadZone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /갤러리/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /카메라/i })).toBeInTheDocument();
    });
  });
});
