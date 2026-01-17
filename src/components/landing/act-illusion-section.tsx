"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * 떨어지는 단어 컴포넌트
 */
function FallingWord({
  word,
  delay,
  x,
  rotation,
}: {
  word: string;
  delay: number;
  x: number;
  rotation: number;
}) {
  return (
    <motion.span
      className="absolute whitespace-nowrap font-serif text-2xl font-bold md:text-4xl"
      style={{
        color: "var(--text-muted)",
        left: `${50 + x}%`,
        opacity: 0.6,
      }}
      initial={{ y: -100, opacity: 0, rotate: 0 }}
      animate={{
        y: ["0%", "120vh"],
        opacity: [0, 0.6, 0.6, 0],
        rotate: [0, rotation],
        scale: [1, 0.8],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        repeatDelay: 6,
        ease: "easeIn",
      }}
    >
      {word}
    </motion.span>
  );
}

/**
 * 아이폰 목업 컴포넌트
 */
function IPhoneMockup() {
  return (
    <motion.div
      className="relative"
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {/* 아이폰 프레임 */}
      <div
        className="relative mx-auto h-[500px] w-[260px] overflow-hidden rounded-[40px] md:h-[600px] md:w-[300px]"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)",
          boxShadow: `
            0 50px 100px -20px rgba(0,0,0,0.15),
            0 30px 60px -30px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.8)
          `,
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        {/* 노치 */}
        <div className="absolute left-1/2 top-4 h-6 w-24 -translate-x-1/2 rounded-full bg-black/10" />

        {/* 화면 영역 */}
        <div
          className="absolute inset-4 top-14 overflow-hidden rounded-[28px]"
          style={{
            background:
              "linear-gradient(180deg, var(--prism-pink) 0%, var(--prism-violet) 50%, var(--prism-blue) 100%)",
          }}
        >
          {/* 화면 내 콘텐츠 - 결과물 미리보기 */}
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <motion.div
              className="mb-4 h-32 w-32 rounded-full md:h-40 md:w-40"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-aurora-pink), var(--color-aurora-purple))",
                boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)",
              }}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 20px 40px rgba(236, 72, 153, 0.3)",
                  "0 30px 60px rgba(236, 72, 153, 0.4)",
                  "0 20px 40px rgba(236, 72, 153, 0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-hero)" }}
            >
              당신만의 아뜰리에
            </p>
          </div>
        </div>

        {/* 홈 인디케이터 */}
        <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-black/20" />
      </div>

      {/* Glow 효과 */}
      <div
        className="absolute -inset-20 -z-10 opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--prism-pink) 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}

/**
 * Act 2: The Illusion (기능 소개의 재해석)
 *
 * 거대한 아이폰 목업이 공중에 떠 있고,
 * "스트레스, 비용, 시간" 단어들이 바닥으로 떨어져 부서지는 애니메이션
 */
export function ActIllusionSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const phoneY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);

  const fallingWords = [
    { word: "스트레스", delay: 0, x: -30, rotation: -25 },
    { word: "비용", delay: 1.5, x: 25, rotation: 30 },
    { word: "시간", delay: 3, x: -15, rotation: -15 },
    { word: "압박감", delay: 4.5, x: 20, rotation: 20 },
  ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden py-[var(--space-section)]"
      aria-label="마법의 시작"
    >
      {/* 떨어지는 단어들 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {fallingWords.map((item, index) => (
          <FallingWord key={index} {...item} />
        ))}
      </div>

      <div className="container relative z-10 mx-auto flex flex-col items-center px-4">
        {/* 카피 */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p
            className="mb-6 font-sans text-base tracking-wide md:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            우리는 &apos;촬영&apos;을 발명하지 않았습니다.
          </p>
          <h2
            className="font-serif font-bold leading-tight"
            style={{
              fontSize: "var(--text-display-md)",
              color: "var(--text-hero)",
            }}
          >
            <span className="block">모든 제약을</span>
            <span
              className="block bg-gradient-to-r from-[var(--color-aurora-teal)] to-[var(--color-aurora-indigo)] bg-clip-text text-transparent"
            >
              사라지게 했을 뿐.
            </span>
          </h2>
        </motion.div>

        {/* 아이폰 목업 */}
        <motion.div
          style={{
            y: phoneY,
            rotate: phoneRotate,
          }}
        >
          <IPhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}
