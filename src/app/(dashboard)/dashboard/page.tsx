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
  type DashboardStep,
} from '@/features/dashboard-v2';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { startNewShoot, isCreating } = useSmartNavigation();
  const { step, setStep } = useDashboardStep();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 초기 로딩 시뮬레이션 (실제로는 데이터 로딩과 연동)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStartNew = async () => {
    await startNewShoot();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className={cn('w-full max-w-7xl mx-auto px-8', HEADER_HEIGHT.padding, 'pb-12')}>
          <div className="space-y-8">
            <Skeleton className="h-20 w-64 rounded-xl" />
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                  ))}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-4 space-y-4">
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            />
          )}
          {/* theme, shooting 단계는 추후 구현 */}
        </AnimatePresence>
      </div>
    </div>
  );
}
