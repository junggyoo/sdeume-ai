'use client';

import { useState, useEffect } from 'react';
import { AtelierHeader } from '@/features/dashboard-v2';

export type AppHeaderVariant = 'light' | 'dark';

interface AppHeaderProps {
  variant?: AppHeaderVariant;
  className?: string;
}

/**
 * AppHeader - 앱 전역 헤더 래퍼 컴포넌트
 *
 * 스크롤 감지 로직을 포함하여 AtelierHeader를 래핑합니다.
 * variant prop으로 light/dark 테마를 지원합니다.
 */
export function AppHeader({ variant = 'light', className }: AppHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AtelierHeader
      isScrolled={isScrolled}
      variant={variant}
      className={className}
    />
  );
}
