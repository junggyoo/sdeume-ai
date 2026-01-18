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
  describe('렌더링', () => {
    it('should render empty state when no photos', () => {
      render(<PhotoGrid items={[]} onRemove={vi.fn()} />);

      expect(screen.getByText(/사진이 없습니다/i)).toBeInTheDocument();
    });

    it('should render PhotoCard for each item', () => {
      const items = [
        createQueuedFile('1', 'A'),
        createQueuedFile('2', 'B'),
        createQueuedFile('3', 'C'),
      ];
      render(<PhotoGrid items={items} onRemove={vi.fn()} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
    });

    it('should render in grid layout', () => {
      const items = [createQueuedFile('1', 'A')];
      const { container } = render(<PhotoGrid items={items} onRemove={vi.fn()} />);

      const grid = container.querySelector('[data-testid="photo-grid"]');
      expect(grid).toHaveClass('grid');
    });
  });

  describe('그리드 레이아웃', () => {
    it('should have 4 columns by default', () => {
      const items = [createQueuedFile('1', 'A')];
      const { container } = render(<PhotoGrid items={items} onRemove={vi.fn()} />);

      const grid = container.querySelector('[data-testid="photo-grid"]');
      expect(grid).toHaveClass('grid-cols-4');
    });

    it('should accept custom columns prop', () => {
      const items = [createQueuedFile('1', 'A')];
      const { container } = render(<PhotoGrid items={items} onRemove={vi.fn()} columns={3} />);

      const grid = container.querySelector('[data-testid="photo-grid"]');
      expect(grid).toHaveClass('grid-cols-3');
    });
  });

  describe('삭제 기능', () => {
    it('should pass onRemove to PhotoCard', () => {
      const onRemove = vi.fn();
      const items = [createQueuedFile('test-id', 'A')];
      render(<PhotoGrid items={items} onRemove={onRemove} />);

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
      render(<PhotoGrid items={items} onRemove={vi.fn()} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'blob:first');
      expect(images[1]).toHaveAttribute('src', 'blob:second');
      expect(images[2]).toHaveAttribute('src', 'blob:third');
    });
  });

  describe('스타일', () => {
    it('should have gap between items', () => {
      const items = [createQueuedFile('1', 'A')];
      const { container } = render(<PhotoGrid items={items} onRemove={vi.fn()} />);

      const grid = container.querySelector('[data-testid="photo-grid"]');
      expect(grid).toHaveClass('gap-2');
    });
  });

  describe('빈 상태 커스터마이징', () => {
    it('should display custom empty message', () => {
      render(
        <PhotoGrid
          items={[]}
          onRemove={vi.fn()}
          emptyMessage="아직 업로드된 사진이 없어요"
        />
      );

      expect(screen.getByText('아직 업로드된 사진이 없어요')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('should have grid role', () => {
      const items = [createQueuedFile('1', 'A')];
      render(<PhotoGrid items={items} onRemove={vi.fn()} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });
});
