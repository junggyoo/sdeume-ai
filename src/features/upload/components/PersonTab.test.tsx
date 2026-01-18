import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonTab } from './PersonTab';
import type { UploadRole } from '../types';

describe('PersonTab', () => {
  const defaultProps = {
    activeRole: 'bride' as UploadRole,
    onRoleChange: vi.fn(),
    groomCount: 5,
    brideCount: 10,
    groomComplete: false,
    brideComplete: false,
  };

  describe('렌더링', () => {
    it('should render both tabs', () => {
      render(<PersonTab {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /신부/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /신랑/i })).toBeInTheDocument();
    });

    it('should display emoji icons', () => {
      render(<PersonTab {...defaultProps} />);

      expect(screen.getByText('👰')).toBeInTheDocument();
      expect(screen.getByText('🤵')).toBeInTheDocument();
    });

    it('should display counts for each role', () => {
      render(<PersonTab {...defaultProps} groomCount={5} brideCount={10} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('활성 탭 스타일', () => {
    it('should highlight active bride tab', () => {
      render(<PersonTab {...defaultProps} activeRole="bride" />);

      const brideTab = screen.getByRole('tab', { name: /신부/i });
      expect(brideTab).toHaveClass('bg-violet-600');
      expect(brideTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should highlight active groom tab', () => {
      render(<PersonTab {...defaultProps} activeRole="groom" />);

      const groomTab = screen.getByRole('tab', { name: /신랑/i });
      expect(groomTab).toHaveClass('bg-violet-600');
      expect(groomTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should not highlight inactive tabs', () => {
      render(<PersonTab {...defaultProps} activeRole="bride" />);

      const groomTab = screen.getByRole('tab', { name: /신랑/i });
      expect(groomTab).not.toHaveClass('bg-violet-600');
      expect(groomTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('탭 클릭', () => {
    it('should call onRoleChange with bride when bride tab is clicked', () => {
      const onRoleChange = vi.fn();
      render(<PersonTab {...defaultProps} activeRole="groom" onRoleChange={onRoleChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /신부/i }));

      expect(onRoleChange).toHaveBeenCalledWith('bride');
    });

    it('should call onRoleChange with groom when groom tab is clicked', () => {
      const onRoleChange = vi.fn();
      render(<PersonTab {...defaultProps} activeRole="bride" onRoleChange={onRoleChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /신랑/i }));

      expect(onRoleChange).toHaveBeenCalledWith('groom');
    });
  });

  describe('완료 상태', () => {
    it('should show checkmark when bride is complete', () => {
      render(<PersonTab {...defaultProps} brideComplete />);

      const brideTab = screen.getByRole('tab', { name: /신부/i });
      expect(brideTab).toContainElement(screen.getByTestId('bride-complete-icon'));
    });

    it('should show checkmark when groom is complete', () => {
      render(<PersonTab {...defaultProps} groomComplete />);

      const groomTab = screen.getByRole('tab', { name: /신랑/i });
      expect(groomTab).toContainElement(screen.getByTestId('groom-complete-icon'));
    });

    it('should not show checkmark when not complete', () => {
      render(<PersonTab {...defaultProps} brideComplete={false} groomComplete={false} />);

      expect(screen.queryByTestId('bride-complete-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('groom-complete-icon')).not.toBeInTheDocument();
    });

    it('should show both checkmarks when both are complete', () => {
      render(<PersonTab {...defaultProps} brideComplete groomComplete />);

      expect(screen.getByTestId('bride-complete-icon')).toBeInTheDocument();
      expect(screen.getByTestId('groom-complete-icon')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('should have tablist role on container', () => {
      render(<PersonTab {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have tab role on each button', () => {
      render(<PersonTab {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });

    it('should indicate selected state via aria-selected', () => {
      render(<PersonTab {...defaultProps} activeRole="bride" />);

      const brideTab = screen.getByRole('tab', { name: /신부/i });
      const groomTab = screen.getByRole('tab', { name: /신랑/i });

      expect(brideTab).toHaveAttribute('aria-selected', 'true');
      expect(groomTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('다크 모드 스타일', () => {
    it('should have dark background', () => {
      const { container } = render(<PersonTab {...defaultProps} />);

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveClass('bg-slate-800');
    });
  });
});
