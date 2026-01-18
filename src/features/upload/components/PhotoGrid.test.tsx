import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhotoGrid } from './PhotoGrid';
import type { QueuedFile, BucketType } from '../types';

// 테스트용 QueuedFile 헬퍼
function createQueuedFile(
  id: string,
  bucket?: BucketType,
  status: QueuedFile['status'] = 'completed'
): QueuedFile {
  return {
    id,
    file: new File([''], `${id}.jpg`, { type: 'image/jpeg' }),
    role: 'bride',
    status,
    progress: 100,
    previewUrl: `blob:${id}`,
    analysis: bucket
      ? {
          faceDetected: true,
          yawAngle: 0,
          smileScore: 0.5,
          eyesOpen: true,
          bucket,
          confidence: 0.95,
          qualityIssues: [],
          isUsable: bucket !== 'D',
        }
      : undefined,
  };
}

describe('PhotoGrid', () => {
  const defaultProps = {
    items: [],
    onRemove: vi.fn(),
    role: 'bride' as const,
    maxPhotos: 20,
  };

  describe('렌더링', () => {
    it('should render title with photo count', () => {
      render(<PhotoGrid {...defaultProps} items={[createQueuedFile('1', 'A')]} />);

      expect(screen.getByText(/신부 업로드된 사진 \(1\/20\)/i)).toBeInTheDocument();
    });

    it('should render PhotoCard for each item', () => {
      const items = [
        createQueuedFile('1', 'A'),
        createQueuedFile('2', 'B'),
        createQueuedFile('3', 'C'),
      ];
      render(<PhotoGrid {...defaultProps} items={items} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
    });

    it('should render in grid layout', () => {
      const items = [createQueuedFile('1', 'A')];
      const { container } = render(<PhotoGrid {...defaultProps} items={items} />);

      const grid = container.querySelector('[data-testid="photo-grid"]');
      expect(grid).toHaveClass('grid');
    });
  });

  describe('그리드 레이아웃', () => {
    it('should have 4 columns by default', () => {
      const items = [createQueuedFile('1', 'A')];
      const { container } = render(<PhotoGrid {...defaultProps} items={items} />);

      const grid = container.querySelector('[data-testid="photo-grid"]');
      expect(grid).toHaveClass('grid-cols-4');
    });

    it('should accept custom columns prop', () => {
      const items = [createQueuedFile('1', 'A')];
      const { container } = render(<PhotoGrid {...defaultProps} items={items} columns={3} />);

      const grid = container.querySelector('[data-testid="photo-grid"]');
      expect(grid).toHaveClass('grid-cols-3');
    });
  });

  describe('삭제 기능', () => {
    it('should pass onRemove to PhotoCard', () => {
      const onRemove = vi.fn();
      const items = [createQueuedFile('test-id', 'A')];
      render(<PhotoGrid {...defaultProps} items={items} onRemove={onRemove} />);

      // PhotoCard의 삭제 버튼 클릭
      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      deleteButton.click();

      expect(onRemove).toHaveBeenCalledWith('test-id');
    });
  });

  describe('정렬', () => {
    it('should maintain order of items', () => {
      const items = [
        createQueuedFile('first', 'A'),
        createQueuedFile('second', 'B'),
        createQueuedFile('third', 'C'),
      ];
      render(<PhotoGrid {...defaultProps} items={items} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'blob:first');
      expect(images[1]).toHaveAttribute('src', 'blob:second');
      expect(images[2]).toHaveAttribute('src', 'blob:third');
    });
  });

  describe('스타일', () => {
    it('should have gap between items', () => {
      const items = [createQueuedFile('1', 'A')];
      const { container } = render(<PhotoGrid {...defaultProps} items={items} />);

      const grid = container.querySelector('[data-testid="photo-grid"]');
      expect(grid).toHaveClass('gap-2');
    });
  });

  describe('추가 버튼', () => {
    it('should show add button when onAddMore is provided', () => {
      render(<PhotoGrid {...defaultProps} onAddMore={vi.fn()} />);

      expect(screen.getByRole('button', { name: /사진 추가/i })).toBeInTheDocument();
    });

    it('should hide add button when at max photos', () => {
      const items = Array(20)
        .fill(null)
        .map((_, i) => createQueuedFile(`${i}`, 'A'));
      render(<PhotoGrid {...defaultProps} items={items} maxPhotos={20} onAddMore={vi.fn()} />);

      expect(screen.queryByRole('button', { name: /사진 추가/i })).not.toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('should have grid role', () => {
      const items = [createQueuedFile('1', 'A')];
      render(<PhotoGrid {...defaultProps} items={items} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });
});
