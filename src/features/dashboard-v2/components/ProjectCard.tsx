'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectCardProps } from '../types';

export function ProjectCard({
  type,
  title,
  date,
  status,
  image,
  onClick,
  className,
}: ProjectCardProps) {
  const isProcessing = status === 'processing';

  return (
    <motion.div
      layout
      data-testid="project-card"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'group relative w-full aspect-[4/5] rounded-[32px] cursor-pointer',
        className
      )}
    >
      {/* Card Surface */}
      <div className="absolute inset-0 rounded-[32px] bg-white/60 backdrop-blur-xl border border-white/80 shadow-xl overflow-hidden flex flex-col transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/10">
        {/* Image Area */}
        <div className="relative h-[65%] w-full bg-gray-50 overflow-hidden">
          {type === 'new' ? (
            <div
              data-testid="plus-icon"
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 group-hover:bg-purple-100 transition-colors duration-500"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
                <Plus size={32} />
              </div>
            </div>
          ) : (
            <>
              {image ? (
                <Image
                  src={image}
                  alt={title || '프로젝트 썸네일'}
                  fill
                  className={cn(
                    'object-cover transition-transform duration-700 group-hover:scale-110',
                    isProcessing && 'grayscale blur-sm opacity-80'
                  )}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Plus className="w-8 h-8 text-gray-300" />
                </div>
              )}
              {isProcessing && (
                <div
                  data-testid="processing-indicator"
                  className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px]"
                >
                  <div className="px-4 py-2 bg-black/70 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg">
                    <Sparkles size={12} className="animate-spin" /> Developing
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Area */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                {type === 'new' ? 'New Session' : date}
              </span>
              {status === 'completed' && (
                <CheckCircle2 size={16} className="text-green-500" />
              )}
            </div>
            <h3
              className={cn(
                'text-xl font-serif font-medium leading-tight',
                type === 'new' ? 'text-purple-900' : 'text-gray-900'
              )}
            >
              {title || 'Start New Shooting'}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500 font-medium group-hover:text-purple-600 transition-colors">
              {type === 'new' ? 'Start Now' : 'Open Gallery'}
            </span>
            <ArrowRight
              size={16}
              className="text-gray-400 group-hover:text-purple-600 transition-colors"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
