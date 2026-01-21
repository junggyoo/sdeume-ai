'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Image as ImageIcon,
  CreditCard,
  Settings,
  LogOut,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserMenuProps } from '../types';
import { ATELIER_ROUTES } from '../constants';

interface MenuItemProps {
  icon: React.ElementType;
  text: string;
  desc?: string;
  isDanger?: boolean;
  onClick?: () => void;
  href?: string;
}

function MenuItem({
  icon: Icon,
  text,
  desc,
  isDanger = false,
  onClick,
  href,
}: MenuItemProps) {
  const content = (
    <>
      <div
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDanger
            ? 'bg-red-50 text-red-500'
            : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
        )}
      >
        <Icon size={16} />
      </div>
      <div>
        <p
          className={cn(
            'text-sm font-medium',
            isDanger ? 'text-red-600' : 'text-gray-700'
          )}
        >
          {text}
        </p>
        {desc && <p className="text-[10px] text-gray-400">{desc}</p>}
      </div>
    </>
  );

  const className = cn(
    'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group',
    isDanger ? 'hover:bg-red-50' : 'hover:bg-white/60 hover:shadow-sm'
  );

  if (href) {
    return (
      <Link href={href} className={className} role="menuitem">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className} role="menuitem">
      {content}
    </button>
  );
}

export function UserMenu({
  userName = 'Guest',
  planType = 'free',
  remainingCount = 3,
  totalCount = 5,
  className,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape 키 감지
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // 이니셜 추출
  const getInitials = () => {
    if (userName) {
      const parts = userName.split(' ');
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return userName.slice(0, 2).toUpperCase();
    }
    return '??';
  };

  // 프로그레스 바 계산
  const progressPercent =
    totalCount > 0 ? Math.round((remainingCount / totalCount) * 100) : 0;

  return (
    <div
      ref={containerRef}
      data-testid="user-menu-container"
      className={cn('relative z-50', className)}
    >
      {/* Trigger */}
      <button
        type="button"
        aria-label="사용자 메뉴"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 pr-3 rounded-full bg-white/40 hover:bg-white/60 border border-white/60 transition-all shadow-sm backdrop-blur-md"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-200 to-blue-200 border border-white shadow-inner flex items-center justify-center text-purple-700 font-bold text-xs">
          {getInitials()}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden md:block">
          {userName}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-gray-400 transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-72 bg-white/80 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden ring-1 ring-black/5"
          >
            {/* 1. Plan Widget Section */}
            <div className="p-5 bg-gradient-to-b from-purple-50/50 to-transparent border-b border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-purple-900 tracking-wider">
                  {planType === 'pro' ? 'PRO PLAN' : 'FREE PLAN'}
                </span>
                {planType !== 'pro' && (
                  <button className="text-[10px] bg-[#191F28] text-white px-2 py-1 rounded-full font-bold hover:scale-105 transition-transform">
                    UPGRADE
                  </button>
                )}
              </div>
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right font-medium">
                {remainingCount} / {totalCount} Credits left
              </p>
            </div>

            {/* 2. Navigation Section */}
            <div className="p-2 space-y-1">
              <MenuItem
                icon={User}
                text="My Face Model"
                desc="Manage training data"
                href={ATELIER_ROUTES.faceManagement}
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                icon={ImageIcon}
                text="Gallery"
                desc="View all albums"
                href={ATELIER_ROUTES.gallery}
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                icon={CreditCard}
                text="Billing History"
                onClick={() => setIsOpen(false)}
              />
            </div>

            {/* 3. System Section */}
            <div className="p-2 border-t border-gray-100 bg-gray-50/30 space-y-1">
              <MenuItem
                icon={Settings}
                text="Settings"
                href={ATELIER_ROUTES.settings}
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                icon={HelpCircle}
                text="Help Center"
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                icon={LogOut}
                text="Log Out"
                isDanger
                onClick={() => {
                  setIsOpen(false);
                  // TODO: 로그아웃 로직
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
