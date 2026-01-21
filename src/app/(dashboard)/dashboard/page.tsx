'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSmartNavigation } from '@/features/shoot/hooks/useSmartNavigation';
import {
  AtelierHeader,
  DashboardHome,
  useDashboardStep,
  HEADER_HEIGHT,
} from '@/features/dashboard-v2';

export default function DashboardPage() {
  const { startNewShoot, isCreating } = useSmartNavigation();
  const { step } = useDashboardStep();
  const [isScrolled, setIsScrolled] = useState(false);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartNew = async () => {
    await startNewShoot();
  };

  return (
    <div className="relative min-h-screen">
      {/* Fixed Header */}
      <AtelierHeader isScrolled={isScrolled} />

      {/* Main Content */}
      <div className={cn('relative z-10 w-full max-w-7xl mx-auto px-8', HEADER_HEIGHT.padding, 'pb-12')}>
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <DashboardHome
              key="home"
              onStartNew={handleStartNew}
              isCreating={isCreating}
            />
          )}
          {/* theme, shooting 단계는 추후 구현 */}
        </AnimatePresence>
      </div>
    </div>
  );
}
