'use client';

import { cn } from '@/lib/utils';
import type { UploadRole, BucketSummary } from '../types';
import { User, Users } from 'lucide-react';

interface RoleTabsProps {
  activeRole: UploadRole;
  onRoleChange: (role: UploadRole) => void;
  groomSummary: BucketSummary;
  brideSummary: BucketSummary;
  className?: string;
}

export function RoleTabs({
  activeRole,
  onRoleChange,
  groomSummary,
  brideSummary,
  className,
}: RoleTabsProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      <RoleTab
        role="groom"
        label="신랑"
        icon={User}
        isActive={activeRole === 'groom'}
        summary={groomSummary}
        onClick={() => onRoleChange('groom')}
        colorClass="bg-blue-100 text-blue-600"
        activeColorClass="ring-blue-500"
      />
      <RoleTab
        role="bride"
        label="신부"
        icon={Users}
        isActive={activeRole === 'bride'}
        summary={brideSummary}
        onClick={() => onRoleChange('bride')}
        colorClass="bg-pink-100 text-pink-600"
        activeColorClass="ring-pink-500"
      />
    </div>
  );
}

interface RoleTabProps {
  role: UploadRole;
  label: string;
  icon: typeof User;
  isActive: boolean;
  summary: BucketSummary;
  onClick: () => void;
  colorClass: string;
  activeColorClass: string;
}

function RoleTab({
  label,
  icon: Icon,
  isActive,
  summary,
  onClick,
  colorClass,
  activeColorClass,
}: RoleTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 p-4 rounded-xl border-2 transition-all',
        'flex flex-col items-center gap-2',
        isActive
          ? `ring-2 ${activeColorClass} border-transparent bg-white shadow-md`
          : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          colorClass
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      <span className="font-medium text-primary-desktop">{label}</span>
      <span className="text-sm text-gray-500">{summary.total}장 업로드</span>
    </button>
  );
}
