"use client";

import { motion } from "framer-motion";
import { PrimaryCta } from "@/components/ui/primary-cta";

/**
 * Act 1: Hero Section (인트로)
 *
 * Prismatic White 배경 위에 Giant Typography가 부유하는 느낌.
 * 심플한 센터 정렬 레이아웃과 Liquid Glass CTA.
 */
export function ActIntroSection() {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center px-4"
      aria-label="히어로"
    >
      {/* 메인 콘텐츠 */}
      <div className="flex flex-col items-center text-center">
        {/* 메인 타이틀 - Giant Typography */}
        <motion.h1
          className="text-giant floating-text"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="block">스튜디오 없는</span>
          <span className="block text-gradient">스튜디오 촬영</span>
        </motion.h1>

        {/* 서브 텍스트 */}
        <motion.p
          className="mt-8 max-w-2xl font-sans text-xl leading-relaxed md:text-2xl"
          style={{ color: "var(--text-body)" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          예약도, 작가도, 1,500만원의 비용도 필요 없습니다.
          <br />
          오직 당신의 얼굴만 준비하세요.
        </motion.p>

        {/* Liquid Glass CTA with Glow Effect */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <PrimaryCta
            href="/login"
            size="xl"
            variant="liquidGlass"
            className="text-lg cta-glow"
          >
            무료로 시작하기
          </PrimaryCta>
        </motion.div>

        {/* 스크롤 힌트 */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span
              className="text-xs font-sans tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              스크롤
            </span>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              style={{ color: "var(--text-muted)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
