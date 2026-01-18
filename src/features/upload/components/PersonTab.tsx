'use client';

import { memo, useCallback } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadRole } from '../types';

export interface PersonTabProps {
  activeRole: UploadRole;
  onRoleChange: (role: UploadRole) => void;
  groomCount: number;
  brideCount: number;
  groomComplete: boolean;
  brideComplete: boolean;
  className?: string;
}

interface TabButtonProps {
  role: UploadRole;
  emoji: string;
  label: string;
  count: number;
  isActive: boolean;
  isComplete: boolean;
  onClick: (role: UploadRole) => void;
}

const TabButton = memo(function TabButton({
  role,
  emoji,
  label,
  count,
  isActive,
  isComplete,
  onClick,
}: TabButtonProps) {
  const handleClick = useCallback(() => {
    onClick(role);
  }, [role, onClick]);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={label}
      onClick={handleClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all',
        isActive
          ? 'bg-violet-600 text-white shadow-lg'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
      )}
    >
      <span className="text-lg">{emoji}</span>
      <span className="font-medium">{label}</span>
      <span
        className={cn(
          'text-sm font-bold px-2 py-0.5 rounded-full',
          isActive ? 'bg-white/20' : 'bg-slate-700'
        )}
      >
        {count}
      </span>
      {isComplete && (
        <Check
          className="w-4 h-4 text-emerald-400"
          data-testid={`${role}-complete-icon`}
        />
      )}
    </button>
  );
});

export const PersonTab = memo(function PersonTab({
  activeRole,
  onRoleChange,
  groomCount,
  brideCount,
  groomComplete,
  brideComplete,
  className,
}: PersonTabProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-2 p-1.5 rounded-xl bg-slate-800 border border-slate-700',
        className
      )}
    >
      <TabButton
        role="bride"
        emoji="👰"
        label="신부"
        count={brideCount}
        isActive={activeRole === 'bride'}
        isComplete={brideComplete}
        onClick={onRoleChange}
      />
      <TabButton
        role="groom"
        emoji="🤵"
        label="신랑"
        count={groomCount}
        isActive={activeRole === 'groom'}
        isComplete={groomComplete}
        onClick={onRoleChange}
      />
    </div>
  );
});
