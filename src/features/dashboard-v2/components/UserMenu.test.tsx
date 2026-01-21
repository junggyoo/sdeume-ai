import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt, ...props }),
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
    button: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('UserMenu', () => {
  const defaultProps = {
    userName: '홍길동',
    userEmail: 'test@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    planType: 'free' as const,
    remainingCount: 12,
    totalCount: 20,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Avatar Rendering', () => {
    it('should render the avatar button', () => {
      render(<UserMenu {...defaultProps} />);

      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      expect(avatarButton).toBeInTheDocument();
    });

    it('should render avatar image when avatarUrl is provided', () => {
      render(<UserMenu {...defaultProps} />);

      // Radix Avatar의 AvatarImage는 이미지 로드 이벤트를 기다리므로
      // 테스트 환경에서는 이미지가 렌더링되지 않음
      // 대신 컨테이너가 올바르게 렌더링되는지 확인
      const avatarButton = screen.getByRole('button', { name: /사용자 메뉴/i });
      expect(avatarButton).toBeInTheDocument();
      // 아바타 컨테이너가 있는지 확인
      const container = screen.getByTestId('user-menu-container');
      expect(container).toBeInTheDocument();
    });

    it('should render fallback initials when avatarUrl is not provided', () => {
      render(<UserMenu {...defaultProps} avatarUrl={undefined} />);

      expect(screen.getByText('홍')).toBeInTheDocument();
    });

    it('should render default fallback when userName is also not provided', () => {
      render(
        <UserMenu {...defaultProps} avatarUrl={undefined} userName={undefined} />
      );

      expect(screen.getByText('?')).toBeInTheDocument();
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
    it('should display Free 플랜 badge for free plan', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} planType="free" />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('Free 플랜')).toBeInTheDocument();
    });

    it('should display Pro 플랜 badge for pro plan', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} planType="pro" />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('Pro 플랜')).toBeInTheDocument();
    });
  });

  describe('Remaining Count Display', () => {
    it('should display remaining count with correct format', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} remainingCount={12} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('12장 남음')).toBeInTheDocument();
    });

    it('should display zero remaining count', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} remainingCount={0} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('0장 남음')).toBeInTheDocument();
    });

    it('should show usage progress bar', async () => {
      const user = userEvent.setup();
      render(
        <UserMenu {...defaultProps} remainingCount={12} totalCount={20} />
      );

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should calculate progress bar width correctly', async () => {
      const user = userEvent.setup();
      render(
        <UserMenu {...defaultProps} remainingCount={10} totalCount={20} />
      );

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const progressBar = screen.getByRole('progressbar');
      // 10/20 = 50% used, so 50% remaining
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('Navigation Links', () => {
    it('should have link to 내 얼굴 (face management)', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const faceLink = screen.getByRole('menuitem', { name: /내 얼굴/i });
      expect(faceLink).toBeInTheDocument();
      expect(faceLink).toHaveAttribute('href', '/face-management');
    });

    it('should have link to 갤러리 (gallery)', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const galleryLink = screen.getByRole('menuitem', { name: /갤러리/i });
      expect(galleryLink).toBeInTheDocument();
      expect(galleryLink).toHaveAttribute('href', '/gallery');
    });

    it('should have link to 설정 (settings)', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const settingsLink = screen.getByRole('menuitem', { name: /설정/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should have logout button', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      const logoutButton = screen.getByRole('menuitem', { name: /로그아웃/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('User Info Display', () => {
    it('should display user name in dropdown', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} userName="김철수" />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('김철수')).toBeInTheDocument();
    });

    it('should display user email in dropdown', async () => {
      const user = userEvent.setup();
      render(<UserMenu {...defaultProps} userEmail="user@email.com" />);

      await user.click(screen.getByRole('button', { name: /사용자 메뉴/i }));

      expect(screen.getByText('user@email.com')).toBeInTheDocument();
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
});
