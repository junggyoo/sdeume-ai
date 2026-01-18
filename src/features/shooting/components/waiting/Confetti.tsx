'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  rotation: number;
  type: 'circle' | 'square' | 'star';
}

const COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // purple
  '#3b82f6', // blue
  '#ec4899', // pink
  '#ffffff', // white
];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 720 - 360,
    type: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
  }));
}

function ParticleShape({ type, color, size }: { type: Particle['type']; color: string; size: number }) {
  if (type === 'circle') {
    return (
      <div
        className="rounded-full"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    );
  }
  
  if (type === 'square') {
    return (
      <div
        className="rounded-sm"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    );
  }
  
  // Star shape
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function Confetti({ isActive, duration = 3000, className }: ConfettiProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const particles = useMemo(() => createParticles(50), []);

  useEffect(() => {
    if (isActive) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  return (
    <AnimatePresence>
      {showConfetti && (
        <div className={cn('fixed inset-0 pointer-events-none overflow-hidden z-50', className)}>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}%`,
                top: -20,
              }}
              initial={{
                y: -20,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                y: window.innerHeight + 100,
                opacity: [1, 1, 0],
                rotate: particle.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: particle.delay,
                ease: [0.23, 0.99, 0.44, 1],
              }}
            >
              <ParticleShape
                type={particle.type}
                color={particle.color}
                size={particle.size}
              />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Sparkle effects for complete screen
interface SparkleProps {
  className?: string;
}

export function SparkleEffects({ className }: SparkleProps) {
  const sparkles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random(),
    })),
    []
  );

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute text-amber-400"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            fontSize: sparkle.size,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
}
