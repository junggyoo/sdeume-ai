'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function MagneticButton({
  children,
  onClick,
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.3;
    const y = (clientY - (top + height / 2)) * 0.3;
    setPosition({ x, y });
  };

  return (
    <motion.button
      ref={ref}
      onClick={disabled ? undefined : onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      disabled={disabled}
      className={`relative group px-12 py-5 rounded-full text-lg font-medium shadow-2xl flex items-center gap-3 overflow-hidden
        ${
          disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            : 'bg-[#191F28] text-white shadow-purple-500/20 cursor-pointer'
        }`}
    >
      <span className="relative z-10 font-serif tracking-wide">{children}</span>
      {!disabled && (
        <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      )}

      {/* Shine Effect */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
}
