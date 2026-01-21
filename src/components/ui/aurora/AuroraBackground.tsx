'use client';

import { motion } from 'framer-motion';

export function AuroraBackground() {
  return (
    <div
      data-testid="aurora-background"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-purple-100/40 blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], rotate: [0, -45, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-100/40 blur-[100px]"
      />
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-pink-100/30 blur-[100px]"
      />
    </div>
  );
}
