import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessingIndicator } from './ProcessingIndicator';
import type { Project } from '@/features/project/types';

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  userId: 'user-1',
  name: 'Test Project',
  status: 'training',
  currentStep: 3,
  selectedThemeId: 'theme-1',
  planId: null,
  groomUploadCount: 5,
  brideUploadCount: 5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('ProcessingIndicator', () => {
  describe('Rendering', () => {
    it('should render the indicator container', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      expect(screen.getByTestId('processing-indicator')).toBeInTheDocument();
    });

    it('should render animated element', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      expect(screen.getByTestId('processing-animation')).toBeInTheDocument();
    });
  });

  describe('Status Messages', () => {
    it('should show training message when project status is training', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      expect(screen.getByText(/얼굴 학습 중/i)).toBeInTheDocument();
    });

    it('should show generating message when project status is generating', () => {
      const project = createMockProject({ status: 'generating' });
      render(<ProcessingIndicator project={project} />);

      expect(screen.getByText(/이미지 생성 중/i)).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should have pulse animation class', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      const animation = screen.getByTestId('processing-animation');
      expect(animation).toHaveClass('animate-pulse');
    });

    it('should have visible spinner or loading indicator', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      // Should have some form of visual loading indicator
      const indicator = screen.getByTestId('processing-indicator');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should have rounded shape for animation element', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      const animation = screen.getByTestId('processing-animation');
      expect(animation.className).toMatch(/rounded/);
    });

    it('should display project name when available', () => {
      const project = createMockProject({ name: 'My Wedding' });
      render(<ProcessingIndicator project={project} />);

      expect(screen.getByText('My Wedding')).toBeInTheDocument();
    });

    it('should display fallback text when project name is null', () => {
      const project = createMockProject({ name: null });
      render(<ProcessingIndicator project={project} />);

      expect(screen.getByText(/프로젝트|화보/i)).toBeInTheDocument();
    });
  });

  describe('Props - className', () => {
    it('should apply custom className', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} className="custom-class" />);

      const indicator = screen.getByTestId('processing-indicator');
      expect(indicator).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} className="bg-blue-500" />);

      const indicator = screen.getByTestId('processing-indicator');
      expect(indicator).toHaveClass('bg-blue-500');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for screen reader updates', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live for dynamic content', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have descriptive aria-label', () => {
      const project = createMockProject({ status: 'training' });
      render(<ProcessingIndicator project={project} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label');
    });
  });
});
