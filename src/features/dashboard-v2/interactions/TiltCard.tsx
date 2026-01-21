'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TiltCardProps } from '../types';

export function TiltCard({
  children,
  maxTilt = 15,
  className,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 마우스 위치 추적
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 부드러운 애니메이션을 위한 spring
  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // -0.5 ~ 0.5 범위로 정규화
    const normalizedX = (event.clientX - centerX) / rect.width;
    const normalizedY = (event.clientY - centerY) / rect.height;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    // 마우스가 나가면 원래 위치로 부드럽게 리셋
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      data-testid="tilt-card-container"
      className="perspective-1000"
    >
      <motion.div
        ref={cardRef}
        data-testid="tilt-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={cn('will-change-transform', className)}
      >
        {children}
      </motion.div>
    </div>
  );
}
