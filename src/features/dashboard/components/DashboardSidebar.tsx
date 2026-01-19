'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Images from 'lucide-react/dist/esm/icons/images';
import User from 'lucide-react/dist/esm/icons/user';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import Settings from 'lucide-react/dist/esm/icons/settings';
import { DASHBOARD_COPY } from '../constants';

export interface DashboardSidebarProps {
  /** Number of photos in gallery */
  galleryCount?: number;
  /** Whether user has registered face model */
  hasFaceModel?: boolean;
  /** User's plan type */
  planType?: 'free' | 'pro';
  /** Remaining generation count */
  remainingCount?: number;
  /** Total generation count for plan */
  totalCount?: number;
  className?: string;
}

export function DashboardSidebar({
  galleryCount = 0,
  hasFaceModel = false,
  planType = 'free',
  remainingCount = 0,
  totalCount = 30,
  className,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      key: 'myStudio',
      label: DASHBOARD_COPY.sidebar.nav.myStudio,
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'gallery',
      label: DASHBOARD_COPY.sidebar.nav.gallery,
      href: '/gallery',
      icon: Images,
      badge: galleryCount > 0 ? galleryCount : undefined,
    },
    {
      key: 'faceManagement',
      label: DASHBOARD_COPY.sidebar.nav.faceManagement,
      href: '/face-management',
      icon: User,
      indicator: hasFaceModel ? 'active' : undefined,
    },
    {
      key: 'myPlan',
      label: DASHBOARD_COPY.sidebar.nav.myPlan,
      href: '/plan',
      icon: CreditCard,
      planBadge: planType === 'pro' ? 'Pro' : undefined,
    },
  ];

  const bottomItems = [
    {
      key: 'help',
      label: DASHBOARD_COPY.sidebar.help,
      href: '/help',
      icon: HelpCircle,
    },
    {
      key: 'settings',
      label: DASHBOARD_COPY.sidebar.settings,
      href: '/settings',
      icon: Settings,
    },
  ];

  const usagePercentage = totalCount > 0 ? ((totalCount - remainingCount) / totalCount) * 100 : 0;

  return (
    <aside
      data-testid="dashboard-sidebar"
      className={cn(
        'flex flex-col h-full rounded-lg bg-slate-900/80 border border-slate-700 backdrop-blur-sm',
        className
      )}
    >
      {/* Brand Section */}
      <div data-testid="brand-section" className="p-4 border-b border-slate-700">
        <h1 className="font-serif text-lg font-bold text-white">
          {DASHBOARD_COPY.sidebar.brand}
        </h1>
        <p className="text-xs text-slate-400">
          {DASHBOARD_COPY.sidebar.brandSubtitle}
        </p>
      </div>

      {/* Main Navigation */}
      <nav
        role="navigation"
        data-testid="sidebar-navigation"
        className="flex-1 p-2"
      >
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-amber-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>

                  {/* Count Badge */}
                  {item.badge !== undefined && (
                    <span className="ml-auto text-xs text-slate-400">
                      {item.badge}
                    </span>
                  )}

                  {/* Active Indicator (green dot) */}
                  {item.indicator === 'active' && (
                    <span
                      data-testid="face-active-indicator"
                      className="w-2 h-2 rounded-full bg-green-500"
                    />
                  )}

                  {/* Plan Badge */}
                  {item.planBadge && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-violet-600 text-white rounded">
                      {item.planBadge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-2 border-t border-slate-700">
        <ul className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-amber-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Plan Usage Section */}
      <div data-testid="plan-usage-section" className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">
            {planType === 'pro' ? 'Pro' : 'Free'}
          </span>
          <Link
            href="/plan"
            className="text-xs font-medium text-violet-400 hover:underline"
          >
            {DASHBOARD_COPY.sidebar.upgrade}
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            data-testid="usage-progress-bar"
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${usagePercentage}%` }}
          />
        </div>

        <p className="mt-1 text-xs text-slate-400">
          {DASHBOARD_COPY.sidebar.remaining(remainingCount)}
        </p>
      </div>
    </aside>
  );
}
