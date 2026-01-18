"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export function ActRealitySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0, 0.3], [60, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-deep-navy flex items-center justify-center"
      aria-label="시작하기"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-champagne-gold/5 blur-[100px] rounded-full animate-pulse" />
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          className="max-w-4xl"
          style={{ opacity: contentOpacity, y: contentY }}
        >
          {/* 메인 타이틀 */}
          <h2 className="font-serif font-light leading-tight text-white text-5xl md:text-8xl">
            <span className="block text-champagne-gold/60 mb-2 text-2xl md:text-3xl font-sans tracking-widest uppercase">Your Moment</span>
            <span className="block text-champagne-gold break-keep">
              인생 화보의 시작
            </span>
          </h2>

          {/* Liquid Glass CTA */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center px-10 py-5 overflow-hidden rounded-full glass-button transition-all duration-500 hover:scale-105"
            >
              <span className="relative z-10 text-xl font-medium text-champagne-gold tracking-widest uppercase break-keep">
                내 웨딩 화보 만들기
              </span>
              <div className="absolute inset-0 bg-champagne-gold/10 group-hover:bg-champagne-gold/20 transition-colors duration-500" />
            </Link>
          </motion.div>

          {/* 신뢰 지표 */}
          <div className="mt-12 flex flex-col items-center gap-4 text-champagne-gold/40 text-sm">
            <p className="break-keep">100% 환불 보장 &middot; 무료 재생성 &middot; 고화질 다운로드</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
