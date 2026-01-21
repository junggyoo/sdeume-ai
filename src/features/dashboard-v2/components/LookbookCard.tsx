'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { LookbookCardProps } from '../types';

export function LookbookCard({
  themeName,
  description,
  image,
  onClick,
}: LookbookCardProps) {
  return (
    <motion.div
      data-testid="lookbook-card"
      onClick={onClick}
      whileHover={{ y: -5 }}
      className="relative min-w-[220px] h-[320px] rounded-[24px] overflow-hidden cursor-pointer group snap-center flex-shrink-0 shadow-sm"
    >
      {/* Background Image */}
      <img
        src={image}
        alt={themeName}
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />

      {/* Elegant Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center text-center p-4">
        <span className="text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          Inspiration
        </span>
        <h4 className="text-2xl font-serif text-white italic mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
          {themeName}
        </h4>
        <p className="text-xs text-white/70 mb-6 line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
          {description}
        </p>
        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300 delay-150">
          <ArrowRight size={14} />
        </div>
      </div>
    </motion.div>
  );
}
