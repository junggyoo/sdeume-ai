'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MagneticButtonProps } from '../types';

export function MagneticButton({
  children,
  onClick,
  magneticStrength = 10,
  className,
  disabled = false,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 버튼 위치 오프셋
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 부드러운 애니메이션
  const springConfig = { damping: 15, stiffness: 200 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 커서 위치에서 중심까지의 오프셋 계산
    const offsetX = (event.clientX - centerX) / rect.width;
    const offsetY = (event.clientY - centerY) / rect.height;

    x.set(offsetX * magneticStrength);
    y.set(offsetY * magneticStrength);
  };

  const handleMouseLeave = () => {
    // 마우스가 나가면 원래 위치로 복귀
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      data-testid="magnetic-button"
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
      }}
      className={cn(
        'relative cursor-pointer will-change-transform',
        'overflow-hidden',
        // Shine effect pseudo element styling
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        'before:translate-x-[-100%] before:skew-x-12',
        'hover:before:animate-shine',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  );
}
