"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const primaryCtaVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)]",
  {
    variants: {
      size: {
        sm: "h-10 px-4 text-sm rounded-[10px]",
        md: "h-12 px-6 text-base rounded-[10px]",
        lg: "h-14 px-8 text-lg rounded-[10px]",
      },
      variant: {
        primary:
          "bg-[var(--color-primary-desktop)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)]",
        secondary:
          "bg-transparent border border-[var(--color-primary-desktop)]/20 text-[var(--color-primary-desktop)] hover:bg-[var(--color-ghost-hover)]",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
  }
);

export interface PrimaryCtaProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof primaryCtaVariants> {
  href?: string;
  asChild?: boolean;
}

const PrimaryCta = React.forwardRef<HTMLButtonElement, PrimaryCtaProps>(
  ({ className, size, variant, href, children, ...props }, ref) => {
    const classes = cn(primaryCtaVariants({ size, variant, className }));

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
PrimaryCta.displayName = "PrimaryCta";

export { PrimaryCta, primaryCtaVariants };
