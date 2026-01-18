import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverallProgress } from './OverallProgress';

describe('OverallProgress', () => {
  const defaultProps = {
    groomCount: 10,
    brideCount: 12,
  };

  describe('렌더링', () => {
    it('should render both role sections', () => {
      render(<OverallProgress {...defaultProps} />);

      expect(screen.getByText('신부')).toBeInTheDocument();
      expect(screen.getByText('신랑')).toBeInTheDocument();
    });

    it('should display counts for each role', () => {
      render(<OverallProgress groomCount={10} brideCount={12} />);

      expect(screen.getByText('12장')).toBeInTheDocument();
      expect(screen.getByText('10장')).toBeInTheDocument();
    });

    it('should display emojis for each role', () => {
      render(<OverallProgress {...defaultProps} />);

      expect(screen.getByText('👰')).toBeInTheDocument();
      expect(screen.getByText('🤵')).toBeInTheDocument();
    });

    it('should render section title', () => {
      render(<OverallProgress {...defaultProps} />);

      expect(screen.getByText('사진 업로드 현황')).toBeInTheDocument();
    });

    it('should display min and recommended guidance', () => {
      render(<OverallProgress {...defaultProps} minPerRole={15} recommendedPerRole={20} />);

      expect(screen.getByText(/최소 15장, 권장 20장/i)).toBeInTheDocument();
    });
  });

  describe('기본값', () => {
    it('should use default minPerRole of 15', () => {
      render(<OverallProgress brideCount={10} groomCount={20} />);

      expect(screen.getByText(/최소 15장/i)).toBeInTheDocument();
    });

    it('should use default recommendedPerRole of 20', () => {
      render(<OverallProgress brideCount={17} groomCount={20} />);

      expect(screen.getByText(/권장 20장/i)).toBeInTheDocument();
    });
  });

  describe('2열 레이아웃', () => {
    it('should have 2 column grid layout', () => {
      const { container } = render(<OverallProgress {...defaultProps} />);

      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('다크 모드', () => {
    it('should have dark background', () => {
      const { container } = render(<OverallProgress {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bg-slate-800');
    });

    it('should have dark border', () => {
      const { container } = render(<OverallProgress {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('border-slate-700');
    });
  });

  describe('커스텀 props', () => {
    it('should accept custom minPerRole', () => {
      render(<OverallProgress {...defaultProps} minPerRole={10} />);

      expect(screen.getByText(/최소 10장/i)).toBeInTheDocument();
    });

    it('should accept custom recommendedPerRole', () => {
      render(<OverallProgress {...defaultProps} recommendedPerRole={30} />);

      expect(screen.getByText(/권장 30장/i)).toBeInTheDocument();
    });
  });
});
