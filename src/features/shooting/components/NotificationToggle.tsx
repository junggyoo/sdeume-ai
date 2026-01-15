'use client';

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationToggleProps {
  className?: string;
  defaultEnabled?: boolean;
  onChange?: (enabled: boolean) => void;
}

export function NotificationToggle({
  className,
  defaultEnabled = true,
  onChange,
}: NotificationToggleProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    onChange?.(newValue);
  };

  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={handleToggle}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-input',
        'bg-white/10 hover:bg-white/15 transition-colors',
        'text-white text-sm',
        className
      )}
    >
      {enabled ? (
        <Bell className="w-5 h-5 text-accent-teal" />
      ) : (
        <BellOff className="w-5 h-5 text-white/60" />
      )}
      <span>알림 받기</span>
      <div
        className={cn(
          'ml-auto w-10 h-6 rounded-full transition-colors',
          enabled ? 'bg-accent-teal' : 'bg-white/30'
        )}
      >
        <div
          className={cn(
            'w-5 h-5 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            'mt-0.5',
            enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </div>
    </button>
  );
}
