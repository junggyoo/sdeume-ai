import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TipBanner } from './TipBanner';

describe('TipBanner', () => {
  describe('렌더링', () => {
    it('should render tip message', () => {
      render(<TipBanner />);

      expect(screen.getByText(/20장이면 완벽해요/i)).toBeInTheDocument();
    });

    it('should render with gradient background', () => {
      const { container } = render(<TipBanner />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('bg-gradient-to-r');
    });

    it('should render lightbulb icon', () => {
      render(<TipBanner />);

      expect(screen.getByTestId('tip-icon')).toBeInTheDocument();
    });
  });

  describe('커스텀 메시지', () => {
    it('should display custom tip message', () => {
      render(<TipBanner tip="다양한 각도의 사진을 올려주세요" />);

      expect(screen.getByText('다양한 각도의 사진을 올려주세요')).toBeInTheDocument();
    });

    it('should display custom title', () => {
      render(<TipBanner title="촬영 팁" />);

      expect(screen.getByText('촬영 팁')).toBeInTheDocument();
    });
  });

  describe('접기/펼치기', () => {
    it('should be dismissible when dismissible prop is true', () => {
      render(<TipBanner dismissible />);

      expect(screen.getByRole('button', { name: /닫기/i })).toBeInTheDocument();
    });

    it('should not show close button by default', () => {
      render(<TipBanner />);

      expect(screen.queryByRole('button', { name: /닫기/i })).not.toBeInTheDocument();
    });
  });

  describe('스타일 variants', () => {
    it('should apply default violet gradient', () => {
      const { container } = render(<TipBanner />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('from-violet-500/20');
    });

    it('should apply success variant when specified', () => {
      const { container } = render(<TipBanner variant="success" />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('from-emerald-500/20');
    });

    it('should apply warning variant when specified', () => {
      const { container } = render(<TipBanner variant="warning" />);

      const banner = container.firstChild;
      expect(banner).toHaveClass('from-amber-500/20');
    });
  });

  describe('접근성', () => {
    it('should have role="note" for informational content', () => {
      render(<TipBanner />);

      expect(screen.getByRole('note')).toBeInTheDocument();
    });
  });
});
