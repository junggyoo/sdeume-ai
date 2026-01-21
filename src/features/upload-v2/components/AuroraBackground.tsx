'use client';

import { motion } from 'framer-motion';

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Purple Aurora Blob */}
      <motion.div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(192, 132, 252, 0.3) 0%, rgba(192, 132, 252, 0) 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 100, 50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Blue Aurora Blob */}
      <motion.div
        className="absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 197, 253, 0.25) 0%, rgba(147, 197, 253, 0) 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, -80, -40, 0],
          y: [0, 80, 40, 0],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Pink Aurora Blob */}
      <motion.div
        className="absolute bottom-0 left-1/3 w-[700px] h-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(ellipse, rgba(251, 207, 232, 0.3) 0%, rgba(251, 207, 232, 0) 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.05, 0.98, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
      />
    </div>
  );
}
