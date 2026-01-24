import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuidelineCard } from './GuidelineCard';

describe('GuidelineCard', () => {
  describe('렌더링', () => {
    it('should render good examples section with Korean title', () => {
      render(<GuidelineCard />);

      expect(screen.getByText('이런 사진이 좋아요')).toBeInTheDocument();
    });

    it('should render bad examples section with Korean title', () => {
      render(<GuidelineCard />);

      expect(screen.getByText('이런 사진은 피해주세요')).toBeInTheDocument();
    });
  });

  describe('좋은 예시 표시', () => {
    it('should display hardcoded good examples', () => {
      render(<GuidelineCard />);

      expect(screen.getByText('정면을 바라본 사진')).toBeInTheDocument();
      expect(screen.getByText('밝고 선명한 사진')).toBeInTheDocument();
      expect(screen.getByText('얼굴이 잘 보이는 사진')).toBeInTheDocument();
    });
  });

  describe('나쁜 예시 표시', () => {
    it('should display hardcoded bad examples', () => {
      render(<GuidelineCard />);

      expect(screen.getByText('선글라스나 마스크 착용')).toBeInTheDocument();
      expect(screen.getByText('심하게 흐릿하거나 어두운 사진')).toBeInTheDocument();
      expect(screen.getByText('얼굴이 가려진 사진')).toBeInTheDocument();
    });
  });

  describe('스타일링', () => {
    it('should apply custom className', () => {
      const { container } = render(<GuidelineCard className="custom-class" />);

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('should have grid layout', () => {
      const { container } = render(<GuidelineCard />);

      const card = container.firstChild;
      expect(card).toHaveClass('grid');
    });

    it('should have dark background for sections', () => {
      render(<GuidelineCard />);

      // Find containers with bg-slate-800/50 class
      const sections = document.querySelectorAll('.bg-slate-800\\/50');
      expect(sections).toHaveLength(2); // Good and bad sections
    });
  });

  describe('아이콘', () => {
    it('should display check icon for good examples section', () => {
      render(<GuidelineCard />);

      // Check icon is rendered in the good examples section header
      const goodSection = screen.getByText('이런 사진이 좋아요').closest('div');
      expect(goodSection?.querySelector('svg')).toBeInTheDocument();
    });

    it('should display X icons for bad examples', () => {
      render(<GuidelineCard />);

      // X icon is rendered in the bad examples section header and each item
      const badSection = screen.getByText('이런 사진은 피해주세요').closest('div');
      expect(badSection?.querySelector('svg')).toBeInTheDocument();
    });
  });
});
