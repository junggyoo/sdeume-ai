"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Act 2: Value Proposition Section
 *
 * 텍스트 좌측, 이미지 우측 레이아웃.
 * 스크롤 시 Parallax 효과로 이미지가 부드럽게 움직임.
 */
export function ActValueSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax 효과
  const imageY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const textY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative py-[var(--space-section)]"
      aria-label="가치 제안"
    >
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* 텍스트 영역 - 좌측 */}
          <motion.div
            className="order-2 lg:order-1"
            style={{ y: textY, opacity }}
          >
            <h2
              className="font-serif font-bold leading-tight"
              style={{
                fontSize: "var(--text-display-md)",
                color: "var(--text-hero)",
              }}
            >
              <span className="block">어색한 미소 대신,</span>
              <span className="block text-gradient">가장 나다운 표정으로</span>
            </h2>

            <p
              className="mt-8 max-w-lg font-sans text-lg leading-relaxed md:text-xl"
              style={{ color: "var(--text-body)" }}
            >
              낯선 작가 앞에서 굳어버린 표정, 마음에 들지 않는 보정본...
              <br />
              <br />
              Sdeume AI에서는 걱정 마세요.
              <br />
              가장 편안한 공간에서 찍은 셀카가 하이엔드 화보가 됩니다.
            </p>
          </motion.div>

          {/* 이미지 영역 - 우측 (Parallax) */}
          <motion.div
            className="order-1 lg:order-2"
            style={{ y: imageY }}
          >
            {/* 이미지 플레이스홀더 - 실제 이미지로 교체 필요 */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl">
              {/* 그라데이션 배경 */}
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    linear-gradient(
                      135deg,
                      var(--prism-violet) 0%,
                      var(--prism-pink) 50%,
                      var(--prism-blue) 100%
                    )
                  `,
                }}
              />

              {/* 유리 효과 오버레이 */}
              <div
                className="absolute inset-8 flex flex-col items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                }}
              >
                {/* 아바타 플레이스홀더 */}
                <motion.div
                  className="h-32 w-32 rounded-full md:h-40 md:w-40"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--prism-pink), var(--prism-violet))",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <p
                  className="mt-6 text-center font-sans text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  AI가 학습한 당신
                </p>
              </div>

              {/* 데코레이션 요소 */}
              <motion.div
                className="absolute right-4 top-4 h-20 w-20 rounded-full opacity-60"
                style={{ backgroundColor: "var(--prism-blue)" }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                className="absolute bottom-4 left-4 h-16 w-16 rounded-full opacity-60"
                style={{ backgroundColor: "var(--prism-pink)" }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
