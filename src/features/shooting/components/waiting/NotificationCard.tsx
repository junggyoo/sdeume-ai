'use client';

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationCardProps {
  className?: string;
  defaultEnabled?: boolean;
  onChange?: (enabled: boolean) => void;
}

export function NotificationCard({
  className,
  defaultEnabled = true,
  onChange,
}: NotificationCardProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    onChange?.(newValue);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-5 py-4 rounded-2xl',
        'bg-white/5 backdrop-blur-sm',
        'border border-white/10',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl',
          enabled ? 'bg-purple-500/20' : 'bg-white/10'
        )}
      >
        {enabled ? (
          <Bell className="w-6 h-6 text-purple-400" />
        ) : (
          <BellOff className="w-6 h-6 text-white/40" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1">
        <p className="text-white font-medium">완료 알림 받기</p>
        <p className="text-sm text-white/50">앱을 닫아도 알림으로 알려드려요</p>
      </div>

      {/* Toggle */}
      <button
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        className={cn(
          'relative w-12 h-7 rounded-full transition-colors duration-200',
          enabled ? 'bg-purple-500' : 'bg-white/20'
        )}
      >
        <div
          className={cn(
            'absolute top-1 w-5 h-5 rounded-full bg-white shadow-md',
            'transition-transform duration-200',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
