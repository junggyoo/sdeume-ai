'use client';

import { AnimatePresence } from 'framer-motion';
import { useSmartNavigation } from '@/features/shoot/hooks/useSmartNavigation';
import { DashboardHome, useDashboardStep } from '@/features/dashboard-v2';

export default function DashboardPage() {
  const { startNewShoot, isCreating } = useSmartNavigation();
  const { step } = useDashboardStep();

  const handleStartNew = async () => {
    await startNewShoot();
  };

  return (
    <div className="relative min-h-screen">
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 pb-12">
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
