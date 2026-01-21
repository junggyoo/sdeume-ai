'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { UserMenu } from './UserMenu';
import type { AtelierHeaderProps } from '../types';
import { ATELIER_COPY, ATELIER_ROUTES } from '../constants';

export function AtelierHeader({
  isScrolled = false,
  className,
}: AtelierHeaderProps) {
  const { user, isLoading } = useCurrentUser();

  // 사용자 정보 추출
  const userInfo = useMemo(() => {
    if (!user) {
      return {
        userName: 'Guest',
        userEmail: undefined,
      };
    }
    const name = user.userMetadata?.name as string | undefined;
    return {
      userName: name ?? user.email?.split('@')[0] ?? 'Guest',
      userEmail: user.email ?? undefined,
    };
  }, [user]);

  return (
    <header
      data-testid="atelier-header"
      role="banner"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm h-20'
          : 'bg-transparent border-transparent h-24',
        className
      )}
    >
      <nav
        role="navigation"
        data-testid="header-inner"
        className="max-w-7xl mx-auto px-6 md:px-8 h-full flex items-center justify-between"
      >
        {/* Brand */}
        <Link
          href={ATELIER_ROUTES.dashboard}
          className="flex items-center gap-2"
        >
          <Sparkles className="text-purple-600" size={20} />
          <span className="text-xl font-serif font-bold tracking-wide text-[#191F28]">
            {ATELIER_COPY.header.brand}
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{ATELIER_COPY.header.status}</span>
          </div>

          {/* User Menu */}
          <UserMenu
            userName={userInfo.userName}
            userEmail={userInfo.userEmail}
          />
        </div>
      </nav>
    </header>
  );
}
