"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StickyCtaProps {
  href: string;
  label: string;
  className?: string;
}

export function StickyCta({ href, label, className }: StickyCtaProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 block md:hidden",
        "bg-[var(--color-primary-mobile)] shadow-[0_-4px_12px_rgba(14,27,42,0.08)]",
        className
      )}
    >
      <div className="px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <Link
          href={href}
          className="flex h-12 w-full items-center justify-center rounded-[10px] bg-white text-base font-semibold text-[var(--color-primary-mobile)] transition-colors hover:bg-white/90 active:bg-white/80"
        >
          {label}
        </Link>
      </div>
    </div>
  );
}
