'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { UploadRole } from '@/features/upload/types';
import { MIN_PHOTOS_PER_ROLE } from '@/features/upload/types';

interface AtelierRoleSwitcherProps {
  activeRole: UploadRole;
  onRoleChange: (role: UploadRole) => void;
  groomCount: number;
  brideCount: number;
}

const roles: { key: UploadRole; label: string }[] = [
  { key: 'groom', label: '신랑' },
  { key: 'bride', label: '신부' },
];

export function AtelierRoleSwitcher({
  activeRole,
  onRoleChange,
  groomCount,
  brideCount,
}: AtelierRoleSwitcherProps) {
  const getCount = (role: UploadRole) =>
    role === 'groom' ? groomCount : brideCount;
  const isComplete = (role: UploadRole) =>
    getCount(role) >= MIN_PHOTOS_PER_ROLE;

  return (
    <div className="w-full flex justify-center md:justify-end md:w-auto">
      <div className="inline-flex p-1.5 bg-gray-100 rounded-full border border-gray-200 shadow-inner">
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => onRoleChange(role.key)}
            className={cn(
              'relative px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap',
              activeRole === role.key
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            {/* Animated background for active state */}
            {activeRole === role.key && (
              <motion.div
                layoutId="role-switcher-bg"
                className="absolute inset-0 bg-white rounded-full shadow-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}

            {/* Label with count badge */}
            <span className="relative z-10 flex items-center gap-2">
              {role.label}
              {getCount(role.key) > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                    isComplete(role.key)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {getCount(role.key)}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
