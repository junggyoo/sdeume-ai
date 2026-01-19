'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Home from 'lucide-react/dist/esm/icons/home';
import { cn } from '@/lib/utils';

const SHOOT_STEPS = [
  { id: 1, path: 'step1', label: '얼굴 등록' },
  { id: 2, path: 'step2', label: '테마 선택' },
  { id: 3, path: 'step3', label: '결제' },
  { id: 4, path: 'progress', label: '촬영 진행' },
  { id: 5, path: 'results', label: '결과 확인' },
] as const;

function getCurrentStep(pathname: string): number {
  const match = pathname.match(/\/new-shoot(?:\/[^/]+)?\/(\w+)/);
  if (!match) return 1;

  const stepPath = match[1];
  const step = SHOOT_STEPS.find((s) => s.path === stepPath);
  return step?.id ?? 1;
}

export function SimpleHeader() {
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);
  const totalSteps = SHOOT_STEPS.length;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-14 items-center px-4">
        {/* Left: Home Button */}
        <Link
          href="/dashboard"
          className="flex items-center text-white/80 hover:text-white transition-colors"
        >
          <Home className="h-5 w-5" />
        </Link>

        {/* Center: Step Indicator */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm font-medium">
              STEP {currentStep} OF {totalSteps}
            </span>
          </div>
        </div>

        {/* Right: Step Dots */}
        <div className="flex items-center gap-1.5">
          {SHOOT_STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                step.id <= currentStep
                  ? 'bg-white'
                  : 'bg-slate-700'
              )}
              title={step.label}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
