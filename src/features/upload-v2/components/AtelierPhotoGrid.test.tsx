import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtelierPhotoGrid } from './AtelierPhotoGrid';
import type { QueuedFile } from '@/features/upload/types';
import type { Upload } from '@/features/upload/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
    }) =>
      React.createElement('div', { className, ...props }, children),
    button: ({
      children,
      className,
      onClick,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) =>
      React.createElement('button', { className, onClick, ...props }, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock AtelierPhotoCard
vi.mock('./AtelierPhotoCard', () => ({
  AtelierPhotoCard: ({ item }: { item: QueuedFile }) =>
    React.createElement('div', { 'data-testid': `photo-card-${item.id}` }, item.id),
}));

// Mock ExistingUploadCard
vi.mock('./ExistingUploadCard', () => ({
  ExistingUploadCard: ({ upload }: { upload: Upload }) =>
    React.createElement(
      'div',
      { 'data-testid': `existing-upload-${upload.id}` },
      upload.id
    ),
}));

// Helper to create mock QueuedFile
const createMockQueuedFile = (id: string): QueuedFile => ({
  id,
  file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
  role: 'groom',
  status: 'completed',
  progress: 100,
  previewUrl: 'data:image/jpeg;base64,test',
});

// Helper to create mock Upload
const createMockUpload = (id: string): Upload => ({
  id,
  projectId: 'project-1',
  userId: 'user-1',
  role: 'groom',
  originalUrl: 'https://example.com/image.jpg',
  croppedUrl: null,
  bucketType: 'A',
  faceYaw: 5,
  smileScore: 0.3,
  qualityScore: 0.9,
  isSelected: true,
  cropMode: 'original',
  cropRect: null,
  createdAt: '2024-01-01T00:00:00Z',
});

describe('AtelierPhotoGrid', () => {
  const mockOnRemove = vi.fn();
  const mockOnAddMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('should render nothing when items and existingUploads are empty', () => {
      render(
        <AtelierPhotoGrid
          items={[]}
          onRemove={mockOnRemove}
          onAddMore={mockOnAddMore}
          maxPhotos={20}
        />
      );

      expect(screen.queryByText('업로드된 사진')).not.toBeInTheDocument();
    });

    it('should render queued files', () => {
      const items = [createMockQueuedFile('local-1'), createMockQueuedFile('local-2')];

      render(
        <AtelierPhotoGrid
          items={items}
          onRemove={mockOnRemove}
          onAddMore={mockOnAddMore}
          maxPhotos={20}
        />
      );

      expect(screen.getByTestId('photo-card-local-1')).toBeInTheDocument();
      expect(screen.getByTestId('photo-card-local-2')).toBeInTheDocument();
    });

    it('should render existing uploads when provided', () => {
      const existingUploads = [
        createMockUpload('existing-1'),
        createMockUpload('existing-2'),
      ];

      render(
        <AtelierPhotoGrid
          items={[]}
          existingUploads={existingUploads}
          onRemove={mockOnRemove}
          onAddMore={mockOnAddMore}
          maxPhotos={20}
        />
      );

      expect(screen.getByTestId('existing-upload-existing-1')).toBeInTheDocument();
      expect(screen.getByTestId('existing-upload-existing-2')).toBeInTheDocument();
    });

    it('should render both existing uploads and queued files', () => {
      const existingUploads = [createMockUpload('existing-1')];
      const items = [createMockQueuedFile('local-1')];

      render(
        <AtelierPhotoGrid
          items={items}
          existingUploads={existingUploads}
          onRemove={mockOnRemove}
          onAddMore={mockOnAddMore}
          maxPhotos={20}
        />
      );

      expect(screen.getByTestId('existing-upload-existing-1')).toBeInTheDocument();
      expect(screen.getByTestId('photo-card-local-1')).toBeInTheDocument();
    });
  });

  describe('count display', () => {
    it('should show combined count of existing uploads and queued files', () => {
      const existingUploads = [createMockUpload('existing-1'), createMockUpload('existing-2')];
      const items = [createMockQueuedFile('local-1')];

      render(
        <AtelierPhotoGrid
          items={items}
          existingUploads={existingUploads}
          onRemove={mockOnRemove}
          onAddMore={mockOnAddMore}
          maxPhotos={20}
        />
      );

      // 2 existing + 1 local = 3 total
      expect(screen.getByText('3/20장')).toBeInTheDocument();
    });
  });

  describe('add more button', () => {
    it('should show add button when total count is below max', () => {
      const items = [createMockQueuedFile('local-1')];

      render(
        <AtelierPhotoGrid
          items={items}
          onRemove={mockOnRemove}
          onAddMore={mockOnAddMore}
          maxPhotos={20}
        />
      );

      expect(screen.getByText('추가')).toBeInTheDocument();
    });

    it('should hide add button when total count reaches max', () => {
      const existingUploads = Array.from({ length: 19 }, (_, i) =>
        createMockUpload(`existing-${i}`)
      );
      const items = [createMockQueuedFile('local-1')];

      render(
        <AtelierPhotoGrid
          items={items}
          existingUploads={existingUploads}
          onRemove={mockOnRemove}
          onAddMore={mockOnAddMore}
          maxPhotos={20}
        />
      );

      // 19 existing + 1 local = 20 total (max reached)
      expect(screen.queryByText('추가')).not.toBeInTheDocument();
    });
  });
});
