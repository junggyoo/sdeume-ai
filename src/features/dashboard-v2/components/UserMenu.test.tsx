import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from './UserMenu';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement('a', { href, ...props }, children),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Supabase client
const mockSignOut = vi.fn().mockResolvedValue({});
vi.mock('@/lib/supabase/browser-client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

// Mock useCurrentUser hook
const mockUserRefresh = vi.fn().mockResolvedValue(undefined);
vi.mock('@/features/auth/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    refresh: mockUserRefresh,
  }),
}));

describe('UserMenu', () => {
  const defaultProps = {
    userName: '홍길동',
    planType: 'free' as const,
    remainingCount: 3,
    totalCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({});
    mockUserRefresh.mockResolvedValue(undefined);
  });

  describe('Avatar Rendering', () => {
    it('should render the avatar button', () => {
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      expect(avatarButton).toBeInTheDocument();
    });

    it('should render user initials in avatar', () => {
      render(<UserMenu {...defaultProps} />);

      // Korean name "홍길동" → first 2 characters "홍길"
      expect(screen.getByText('홍길')).toBeInTheDocument();
    });

    it('should render default initials for Guest', () => {
      render(<UserMenu userName={undefined} />);

      // Default userName is 'Guest', so initials are 'GU'
      expect(screen.getByText('GU')).toBeInTheDocument();
    });
  });

  describe('Dropdown Toggle', () => {
    it('should not show dropdown menu initially', () => {
      render(<UserMenu {...defaultProps} />);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should show dropdown menu when avatar is clicked', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      await user.click(avatarButton);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should hide dropdown menu when clicked again', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      await user.click(avatarButton);
      await user.click(avatarButton);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <UserMenu {...defaultProps} />
          <button data-testid="outside">Outside</button>
        </div>
      );

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      await user.click(avatarButton);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Plan Type Badge', () => {
    it('should display FREE PLAN for free plan', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} planType="free" />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('FREE PLAN')).toBeInTheDocument();
    });

    it('should display PRO PLAN for pro plan', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} planType="pro" />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('PRO PLAN')).toBeInTheDocument();
    });

    it('should show UPGRADE button for free plan', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} planType="free" />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('UPGRADE')).toBeInTheDocument();
    });

    it('should not show UPGRADE button for pro plan', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} planType="pro" />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.queryByText('UPGRADE')).not.toBeInTheDocument();
    });
  });

  describe('Credits Display', () => {
    it('should display credits count', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} remainingCount={3} totalCount={5} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('3 / 5 Credits left')).toBeInTheDocument();
    });

    it('should show progress bar', async () => {
      const user = userEvent.setup();
      render(
        <UserMenu {...defaultProps} remainingCount={3} totalCount={5} />
      );

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should calculate progress bar value correctly', async () => {
      const user = userEvent.setup();
      render(
        <UserMenu {...defaultProps} remainingCount={3} totalCount={5} />
      );

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const progressBar = screen.getByRole('progressbar');
      // 3/5 = 60%
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
    });
  });

  describe('Navigation Links', () => {
    it('should have link to My Face Model', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const faceLink = screen.getByRole('menuitem', { name: /My Face Model/i });
      expect(faceLink).toBeInTheDocument();
    });

    it('should have link to Gallery', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const galleryLink = screen.getByRole('menuitem', { name: /Gallery/i });
      expect(galleryLink).toBeInTheDocument();
    });

    it('should have link to Settings', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const settingsLink = screen.getByRole('menuitem', { name: /Settings/i });
      expect(settingsLink).toBeInTheDocument();
    });

    it('should have logout button', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const logoutButton = screen.getByRole('menuitem', { name: /Log Out/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('User Info Display', () => {
    it('should display user name in trigger button', () => {
      render(<UserMenu {...defaultProps} userName="김철수" />);

      expect(screen.getByText('김철수')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      render(<UserMenu {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('user-menu-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-expanded attribute on avatar button', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      expect(avatarButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(avatarButton);
      expect(avatarButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-haspopup attribute', () => {
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      expect(avatarButton).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should close dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      await user.click(avatarButton);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Variant Styling', () => {
    it('should apply light variant by default', () => {
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      expect(avatarButton).toHaveClass('bg-white/40');
    });

    it('should apply dark variant when specified', () => {
      render(<UserMenu {...defaultProps} variant="dark" />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      expect(avatarButton).toHaveClass('bg-white/10');
    });
  });

  describe('Logout Behavior', () => {
    it('should call supabase signOut when logout is clicked', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      // 메뉴 열기
      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      // 로그아웃 버튼 클릭
      const logoutButton = screen.getByRole('menuitem', { name: /Log Out/i });
      await user.click(logoutButton);

      // signOut이 호출되어야 함
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('should redirect to home page after logout', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));
      await user.click(screen.getByRole('menuitem', { name: /Log Out/i }));

      // 메인 페이지('/')로 리다이렉트되어야 함 ('/login'이 아님)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should call router.refresh after logout', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));
      await user.click(screen.getByRole('menuitem', { name: /Log Out/i }));

      // router.refresh가 호출되어야 함
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should not redirect to /login on logout', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));
      await user.click(screen.getByRole('menuitem', { name: /Log Out/i }));

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/login');
      });
    });

    it('should refresh client auth state after logout to prevent redirect loop', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));
      await user.click(screen.getByRole('menuitem', { name: /Log Out/i }));

      // signOut 후 클라이언트 인증 상태를 동기화해야 함
      await waitFor(() => {
        expect(mockUserRefresh).toHaveBeenCalled();
      });
    });
  });
});
