import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from './HeroSection';
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

describe('HeroSection', () => {
  describe('onboarding state', () => {
    it('should render welcome title for new users', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      expect(screen.getByText(/나만의 AI 웨딩 화보를 만들어보세요/i)).toBeInTheDocument();
    });

    it('should render welcome subtitle for new users', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      expect(screen.getByText(/얼굴 사진을 등록하고/i)).toBeInTheDocument();
    });

    it('should render "얼굴 모델 등록하기" CTA button for new users', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      expect(screen.getByRole('button', { name: /얼굴 모델 등록하기/i })).toBeInTheDocument();
    });

    it('should call onCreateProject when CTA is clicked for new users', () => {
      const onCreateProject = vi.fn();
      render(
        <HeroSection
          state="onboarding"
          processingProject={null}
          onCreateProject={onCreateProject}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /얼굴 모델 등록하기/i }));

      expect(onCreateProject).toHaveBeenCalledTimes(1);
    });

    it('should disable CTA button when isCreatingProject is true', () => {
      render(
        <HeroSection
          state="onboarding"
          processingProject={null}
          isCreatingProject={true}
        />
      );

      expect(screen.getByRole('button', { name: /얼굴 모델 등록하기/i })).toBeDisabled();
    });
  });

  describe('processing state', () => {
    it('should render processing title', () => {
      const processingProject = createMockProject({ status: 'training' });
      render(<HeroSection state="processing" processingProject={processingProject} />);

      expect(screen.getByText(/화보를 생성하고 있어요/i)).toBeInTheDocument();
    });

    it('should render processing subtitle', () => {
      const processingProject = createMockProject({ status: 'training' });
      render(<HeroSection state="processing" processingProject={processingProject} />);

      expect(screen.getByText(/잠시만 기다려주세요/i)).toBeInTheDocument();
    });

    it('should render training status message when project is training', () => {
      const processingProject = createMockProject({ status: 'training' });
      render(<HeroSection state="processing" processingProject={processingProject} />);

      expect(screen.getByText(/얼굴 학습 중/i)).toBeInTheDocument();
    });

    it('should render generating status message when project is generating', () => {
      const processingProject = createMockProject({ status: 'generating' });
      render(<HeroSection state="processing" processingProject={processingProject} />);

      expect(screen.getByText(/이미지 생성 중/i)).toBeInTheDocument();
    });

    it('should render ProcessingIndicator component', () => {
      const processingProject = createMockProject({ status: 'training' });
      render(<HeroSection state="processing" processingProject={processingProject} />);

      expect(screen.getByTestId('processing-indicator')).toBeInTheDocument();
    });

    it('should not render CTA button in processing state', () => {
      const processingProject = createMockProject({ status: 'training' });
      render(<HeroSection state="processing" processingProject={processingProject} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('ready state', () => {
    it('should render ready title', () => {
      render(<HeroSection state="ready" processingProject={null} />);

      expect(screen.getByText(/새로운 화보를 촬영해보세요/i)).toBeInTheDocument();
    });

    it('should render ready subtitle', () => {
      render(<HeroSection state="ready" processingProject={null} />);

      expect(screen.getByText(/다양한 테마로/i)).toBeInTheDocument();
    });

    it('should render "새 촬영 시작하기" CTA button', () => {
      render(<HeroSection state="ready" processingProject={null} />);

      expect(screen.getByRole('button', { name: /새 촬영 시작하기/i })).toBeInTheDocument();
    });

    it('should call onCreateProject when CTA is clicked for ready users', () => {
      const onCreateProject = vi.fn();
      render(
        <HeroSection
          state="ready"
          processingProject={null}
          onCreateProject={onCreateProject}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /새 촬영 시작하기/i }));

      expect(onCreateProject).toHaveBeenCalledTimes(1);
    });

    it('should disable CTA button when isCreatingProject is true', () => {
      render(
        <HeroSection
          state="ready"
          processingProject={null}
          isCreatingProject={true}
        />
      );

      expect(screen.getByRole('button', { name: /새 촬영 시작하기/i })).toBeDisabled();
    });
  });

  describe('Rendering Structure', () => {
    it('should render hero section container', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should have section landmark role', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should have accessible label for section', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-label');
    });
  });

  describe('Styling', () => {
    it('should have gradient background', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      const hero = screen.getByTestId('hero-section');
      expect(hero.className).toMatch(/bg-gradient|from-|to-/);
    });

    it('should have rounded corners', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      const hero = screen.getByTestId('hero-section');
      expect(hero.className).toMatch(/rounded/);
    });

    it('should have proper padding', () => {
      render(<HeroSection state="onboarding" processingProject={null} />);

      const hero = screen.getByTestId('hero-section');
      expect(hero.className).toMatch(/p-/);
    });
  });

  describe('Props - className', () => {
    it('should apply custom className', () => {
      render(
        <HeroSection
          state="onboarding"
          processingProject={null}
          className="custom-class"
        />
      );

      const hero = screen.getByTestId('hero-section');
      expect(hero).toHaveClass('custom-class');
    });
  });
});
