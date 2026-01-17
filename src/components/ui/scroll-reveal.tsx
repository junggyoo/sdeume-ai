"use client";

import { motion, useInView, Variants, UseInViewOptions } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  /** Animation delay in seconds */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Y offset for animation start */
  yOffset?: number;
  /** Additional className */
  className?: string;
  /** Whether to only animate once */
  once?: boolean;
  /** Viewport margin for triggering animation */
  margin?: UseInViewOptions["margin"];
}

/**
 * Scroll Reveal Animation Component
 *
 * Framer Motion useInView 기반 스크롤 애니메이션.
 * 요소가 뷰포트에 들어올 때 아래에서 위로 페이드인 됩니다.
 */
export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.6,
  yOffset = 60,
  className = "",
  once = true,
  margin = "-100px",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin });

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: yOffset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1], // Custom easing
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  /** Delay between each child animation */
  staggerDelay?: number;
  /** Additional className */
  className?: string;
  /** Whether to only animate once */
  once?: boolean;
}

/**
 * Stagger Container for sequential child animations
 *
 * 자식 요소들이 순차적으로 애니메이션됩니다.
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.12,
  className = "",
  once = true,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  /** Animation duration in seconds */
  duration?: number;
  /** Y offset for animation start */
  yOffset?: number;
  /** Additional className */
  className?: string;
}

/**
 * Stagger Item - Use inside StaggerContainer
 *
 * StaggerContainer 내부에서 사용하는 개별 아이템.
 */
export function StaggerItem({
  children,
  duration = 0.5,
  yOffset = 40,
  className = "",
}: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: yOffset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
