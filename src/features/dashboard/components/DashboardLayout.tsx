import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  children,
  sidebar,
  className,
}: DashboardLayoutProps) {
  return (
    <div
      data-testid="dashboard-layout"
      className={cn(
        'min-h-screen bg-surface',
        'grid gap-6 p-4 md:p-6',
        sidebar && 'md:grid-cols-[280px_1fr]',
        className
      )}
    >
      {sidebar && (
        <aside
          role="complementary"
          data-testid="sidebar-container"
          className="hidden md:block"
        >
          {sidebar}
        </aside>
      )}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
