import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoCard } from './PhotoCard';
import type { QueuedFile, BucketType, QualityIssue } from '../types';

// 테스트용 QueuedFile 헬퍼
function createQueuedFile(
  overrides: Partial<QueuedFile> & {
    bucket?: BucketType;
    qualityIssues?: QualityIssue[];
    rejectionReason?: string;
  } = {}
): QueuedFile {
  const { bucket, qualityIssues, rejectionReason, ...rest } = overrides;

  return {
    id: 'test-id',
    file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
    role: 'bride',
    status: 'completed',
    progress: 100,
    previewUrl: 'blob:test-preview-url',
    analysis: bucket
      ? {
          faceDetected: true,
          yawAngle: 0,
          smileScore: 0.5,
          eyesOpen: !qualityIssues?.includes('eyes_closed'),
          bucket,
          confidence: 0.95,
          qualityIssues: qualityIssues ?? [],
          isUsable: bucket !== 'D',
          rejectionReason,
        }
      : undefined,
    ...rest,
  };
}

describe('PhotoCard', () => {
  describe('렌더링', () => {
    it('should render image with preview URL', () => {
      const file = createQueuedFile({ bucket: 'A' });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'blob:test-preview-url');
    });

    it('should render delete button', () => {
      const file = createQueuedFile({ bucket: 'A' });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByRole('button', { name: /삭제/i })).toBeInTheDocument();
    });
  });

  describe('상태별 테두리 색상', () => {
    it('should have green border for valid status (bucket A/B/C without issues)', () => {
      const file = createQueuedFile({ bucket: 'A', qualityIssues: [] });
      const { container } = render(<PhotoCard item={file} onRemove={vi.fn()} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border-emerald-400');
    });

    it('should have yellow border for warning status (eyes_closed)', () => {
      const file = createQueuedFile({
        bucket: 'B',
        qualityIssues: ['eyes_closed'],
      });
      const { container } = render(<PhotoCard item={file} onRemove={vi.fn()} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border-amber-400');
    });

    it('should have red border for invalid status (bucket D)', () => {
      const file = createQueuedFile({
        bucket: 'D',
        qualityIssues: ['no_face'],
        rejectionReason: '얼굴이 인식되지 않아요',
      });
      const { container } = render(<PhotoCard item={file} onRemove={vi.fn()} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border-red-400');
    });
  });

  describe('상태 아이콘', () => {
    it('should show CheckCircle icon for valid status', () => {
      const file = createQueuedFile({ bucket: 'A', qualityIssues: [] });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByTestId('status-icon-CheckCircle')).toBeInTheDocument();
    });

    it('should show AlertCircle icon for warning status', () => {
      const file = createQueuedFile({
        bucket: 'B',
        qualityIssues: ['eyes_closed'],
      });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByTestId('status-icon-AlertCircle')).toBeInTheDocument();
    });

    it('should show XCircle icon for invalid status', () => {
      const file = createQueuedFile({
        bucket: 'D',
        qualityIssues: ['no_face'],
      });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByTestId('status-icon-XCircle')).toBeInTheDocument();
    });
  });

  describe('분석 중 상태', () => {
    it('should show spinner when status is analyzing', () => {
      const file = createQueuedFile({ status: 'analyzing' });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByTestId('status-icon-Loader2')).toBeInTheDocument();
    });

    it('should show analyzing message', () => {
      const file = createQueuedFile({ status: 'analyzing' });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByText('분석 중...')).toBeInTheDocument();
    });
  });

  describe('invalid 상태 시각 효과', () => {
    it('should apply grayscale filter for invalid status', () => {
      const file = createQueuedFile({
        bucket: 'D',
        qualityIssues: ['no_face'],
      });
      const { container } = render(<PhotoCard item={file} onRemove={vi.fn()} />);

      const image = container.querySelector('img');
      expect(image).toHaveClass('grayscale');
    });

    it('should not apply grayscale for valid status', () => {
      const file = createQueuedFile({ bucket: 'A', qualityIssues: [] });
      const { container } = render(<PhotoCard item={file} onRemove={vi.fn()} />);

      const image = container.querySelector('img');
      expect(image).not.toHaveClass('grayscale');
    });
  });

  describe('삭제 버튼', () => {
    it('should call onRemove with id when delete button is clicked', () => {
      const onRemove = vi.fn();
      const file = createQueuedFile({ id: 'test-file-id', bucket: 'A' });
      render(<PhotoCard item={file} onRemove={onRemove} />);

      fireEvent.click(screen.getByRole('button', { name: /삭제/i }));

      expect(onRemove).toHaveBeenCalledWith('test-file-id');
    });

    it('should call onRemove only once per click', () => {
      const onRemove = vi.fn();
      const file = createQueuedFile({ bucket: 'A' });
      render(<PhotoCard item={file} onRemove={onRemove} />);

      fireEvent.click(screen.getByRole('button', { name: /삭제/i }));
      fireEvent.click(screen.getByRole('button', { name: /삭제/i }));

      expect(onRemove).toHaveBeenCalledTimes(2);
    });
  });

  describe('상태 메시지 표시', () => {
    it('should display valid message for good photos', () => {
      const file = createQueuedFile({ bucket: 'A', qualityIssues: [] });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByText('좋은 사진이에요!')).toBeInTheDocument();
    });

    it('should display warning message for eyes closed', () => {
      const file = createQueuedFile({
        bucket: 'B',
        qualityIssues: ['eyes_closed'],
      });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByText('눈을 감았어요')).toBeInTheDocument();
    });

    it('should display rejection reason for invalid photos', () => {
      const file = createQueuedFile({
        bucket: 'D',
        qualityIssues: ['no_face'],
        rejectionReason: '얼굴이 인식되지 않아요',
      });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByText('얼굴이 인식되지 않아요')).toBeInTheDocument();
    });
  });

  describe('업로드 중 상태', () => {
    it('should show uploading indicator when status is uploading', () => {
      const file = createQueuedFile({ status: 'uploading', bucket: 'A' });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      expect(screen.getByText('업로드 중...')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('should have accessible delete button', () => {
      const file = createQueuedFile({ bucket: 'A' });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      const button = screen.getByRole('button', { name: /삭제/i });
      expect(button).toBeInTheDocument();
    });

    it('should have alt text for image', () => {
      const file = createQueuedFile({ bucket: 'A' });
      render(<PhotoCard item={file} onRemove={vi.fn()} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt');
    });
  });
});
