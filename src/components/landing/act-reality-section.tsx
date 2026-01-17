"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { PrimaryCta } from "@/components/ui/primary-cta";

/**
 * Act 5: CTA Section (시작하기)
 *
 * 라이트 테마의 Prismatic White 배경 위에
 * 심플한 텍스트와 Liquid Glass CTA 버튼.
 */
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
      className="relative min-h-screen overflow-hidden"
      aria-label="시작하기"
    >
      {/* 배경 - Prismatic 그라데이션 */}
      <div className="absolute inset-0">
        <div
          className="h-full w-full"
          style={{
            background: `
              radial-gradient(
                ellipse 80% 60% at 50% 100%,
                var(--prism-pink) 0%,
                var(--prism-violet) 30%,
                var(--prism-blue) 60%,
                transparent 100%
              )
            `,
            opacity: 0.4,
          }}
        />
      </div>

      {/* 플로팅 데코 요소 */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full blur-[80px] opacity-30"
        style={{ backgroundColor: "var(--prism-pink)" }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute right-1/4 bottom-1/3 h-48 w-48 rounded-full blur-[60px] opacity-30"
        style={{ backgroundColor: "var(--prism-blue)" }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <motion.div
          className="max-w-3xl"
          style={{
            opacity: contentOpacity,
            y: contentY,
          }}
        >
          {/* 메인 타이틀 */}
          <motion.h2
            className="font-serif font-bold leading-tight floating-text"
            style={{
              fontSize: "var(--text-display-md)",
              color: "var(--text-hero)",
            }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="block">당신의 인생 화보가</span>
            <span className="block text-gradient">이곳에서 시작됩니다</span>
          </motion.h2>

          {/* 서브 카피 */}
          <motion.p
            className="mt-8 font-sans text-lg leading-relaxed md:text-xl"
            style={{ color: "var(--text-body)" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            지금 무료로 확인해보세요
          </motion.p>

          {/* Liquid Glass CTA with Glow Effect */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <PrimaryCta
              href="/login"
              size="xl"
              variant="liquidGlass"
              className="text-lg cta-glow"
            >
              내 웨딩 화보 만들기
            </PrimaryCta>
          </motion.div>

          {/* 신뢰 지표 */}
          <motion.p
            className="mt-8 font-sans text-sm"
            style={{ color: "var(--text-muted)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            100% 환불 보장. 결과물이 마음에 들지 않으면 결제하지 않아도 좋습니다.
          </motion.p>

          {/* 추가 신뢰 지표 아이콘 */}
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <span
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              무료 체험
            </span>
            <span
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              개인정보 보호
            </span>
            <span
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              빠른 생성
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
