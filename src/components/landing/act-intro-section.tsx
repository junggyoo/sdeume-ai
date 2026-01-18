"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

export function ActIntroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-deep-navy"
    >
      {/* Background: Ghost Aurora */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-muted-teal/20 via-champagne-gold/5 to-transparent blur-[120px] animate-aurora-flow opacity-60"
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 flex flex-col items-center text-center space-y-12"
      >
        <h1 className="flex flex-col items-center font-serif text-hero leading-tight tracking-tight">
          <motion.span
            initial={{ filter: "blur(20px)", opacity: 0, y: 20 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-light text-champagne-gold/80 mb-6 break-keep"
          >
            스튜디오 없는
          </motion.span>
          <motion.span
            initial={{ filter: "blur(30px)", opacity: 0, scale: 0.95 }}
            animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-8xl font-semibold text-champagne-gold break-keep leading-[1.1]"
          >
            당신만의 화보
          </motion.span>
        </h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          <Link
            href="/login"
            className="group relative px-8 py-4 rounded-full overflow-hidden glass-button transition-all duration-500 hover:scale-105"
          >
            <div className="absolute inset-0 bg-champagne-gold/10 group-hover:bg-champagne-gold/20 transition-colors duration-500" />
            <span className="relative z-10 text-lg md:text-xl font-medium text-champagne-gold tracking-widest uppercase">
              Start Session
            </span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_40px_rgba(234,224,213,0.3)]" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-12 flex flex-col items-center gap-2 text-champagne-gold/40"
      >
        <span className="text-xs uppercase tracking-[0.2em]">Scroll</span>
        <div className="h-12 w-[1px] bg-gradient-to-b from-champagne-gold/0 via-champagne-gold/50 to-champagne-gold/0" />
      </motion.div>
    </section>
  );
}
