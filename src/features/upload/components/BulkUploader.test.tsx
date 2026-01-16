import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkUploader } from './BulkUploader';
import type { QueuedFile } from '../types';

describe('BulkUploader', () => {
  const defaultProps = {
    onFilesSelect: vi.fn(),
    queue: [] as QueuedFile[],
    onRemove: vi.fn(),
    isProcessing: false,
    processingCount: 0,
  };

  // Helper to create mock QueuedFile
  const createMockQueueItem = (
    overrides: Partial<QueuedFile> = {}
  ): QueuedFile => ({
    id: `test-id-${Math.random()}`,
    file: new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
    role: 'groom',
    status: 'pending',
    progress: 0,
    previewUrl: 'blob:http://localhost/test-url',
    ...overrides,
  });

  describe('QueueItem - Image Optimization', () => {
    it('should render img with decoding="async"', () => {
      const item = createMockQueueItem({ status: 'pending' });

      const { container } = render(<BulkUploader {...defaultProps} queue={[item]} />);

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('decoding', 'async');
    });

    it('should render img with loading="lazy"', () => {
      const item = createMockQueueItem({ status: 'pending' });

      const { container } = render(<BulkUploader {...defaultProps} queue={[item]} />);

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should render image with correct src', () => {
      const previewUrl = 'blob:http://localhost/unique-test-url';
      const item = createMockQueueItem({ previewUrl });

      const { container } = render(<BulkUploader {...defaultProps} queue={[item]} />);

      const img = container.querySelector('img');
      expect(img).toHaveAttribute('src', previewUrl);
    });

    it('should not render img when previewUrl is undefined', () => {
      const item = createMockQueueItem({ previewUrl: undefined });

      const { container } = render(<BulkUploader {...defaultProps} queue={[item]} />);

      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('should call onRemove with correct id when remove button clicked', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const item = createMockQueueItem({ id: 'item-123' });

      render(<BulkUploader {...defaultProps} queue={[item]} onRemove={onRemove} />);

      const removeButton = screen.getByRole('button');
      await user.click(removeButton);

      expect(onRemove).toHaveBeenCalledWith('item-123');
    });
  });

  describe('Queue Rendering', () => {
    it('should render all queue items', () => {
      const items = [
        createMockQueueItem({ id: 'item-1' }),
        createMockQueueItem({ id: 'item-2' }),
        createMockQueueItem({ id: 'item-3' }),
      ];

      const { container } = render(<BulkUploader {...defaultProps} queue={items} />);

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(3);
    });

    it('should not render queue grid when queue is empty', () => {
      const { container } = render(<BulkUploader {...defaultProps} queue={[]} />);

      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('should efficiently render 30 queue items', () => {
      const items = Array.from({ length: 30 }, (_, i) =>
        createMockQueueItem({ id: `item-${i}` })
      );

      const { container } = render(
        <BulkUploader {...defaultProps} queue={items} />
      );

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(30);
    });
  });

  describe('Status Display', () => {
    it('should show analyzing spinner when status is analyzing', () => {
      const item = createMockQueueItem({ status: 'analyzing' });

      render(<BulkUploader {...defaultProps} queue={[item]} />);

      // Loader2 has animate-spin class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show excluded overlay when bucket is D', () => {
      const item = createMockQueueItem({
        status: 'completed',
        analysis: {
          faceDetected: true,
          yawAngle: 80,
          smileScore: 0,
          eyesOpen: true,
          bucket: 'D',
          confidence: 0.9,
          qualityIssues: ['extreme_angle'],
          isUsable: false,
          rejectionReason: '극단적 각도',
        },
      });

      render(<BulkUploader {...defaultProps} queue={[item]} />);

      expect(screen.getByText('제외됨')).toBeInTheDocument();
    });

    it('should show bucket badge when completed', () => {
      const item = createMockQueueItem({
        status: 'completed',
        analysis: {
          faceDetected: true,
          yawAngle: 5,
          smileScore: 0.3,
          eyesOpen: true,
          bucket: 'A',
          confidence: 0.95,
          qualityIssues: [],
          isUsable: true,
        },
      });

      render(<BulkUploader {...defaultProps} queue={[item]} />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('Upload Zone', () => {
    it('should show processing state when isProcessing is true', () => {
      render(
        <BulkUploader {...defaultProps} isProcessing={true} processingCount={5} />
      );

      expect(screen.getByText('5장 분석 중...')).toBeInTheDocument();
    });

    it('should show default text when not processing', () => {
      render(<BulkUploader {...defaultProps} isProcessing={false} />);

      expect(screen.getByText('사진 선택하기')).toBeInTheDocument();
      expect(
        screen.getByText('20~30장을 한 번에 선택해주세요')
      ).toBeInTheDocument();
    });

    it('should disable input when disabled prop is true', () => {
      render(<BulkUploader {...defaultProps} disabled={true} />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toBeDisabled();
    });
  });
});
