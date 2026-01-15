'use client';

import { cn } from '@/lib/utils';

interface ImageTrayProps {
  children: React.ReactNode;
  className?: string;
}

export function ImageTray({ children, className }: ImageTrayProps) {
  return (
    <div
      data-testid="image-tray"
      className={cn(
        'flex flex-col items-center justify-end',
        'px-6 pb-8',
        className
      )}
    >
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}
