"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const processSteps = [
  {
    number: "01",
    title: "셀카 업로드",
    description: "잘 나온 셀카 15~20장을 골라주세요",
  },
  {
    number: "02",
    title: "AI 학습",
    description: "당신의 이목구비와 분위기를 완벽하게 학습합니다",
  },
  {
    number: "03",
    title: "화보 완성",
    description: "진짜보다 더 진짜 같은 하이엔드 화보가 탄생합니다",
  },
];

/**
 * Act 3: Process Section
 *
 * Vertical Scroll Reveal 레이아웃.
 * 스크롤 시 프로세스 단계가 순차적으로 나타남.
 */
export function ActProcessSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.2], [60, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative py-[var(--space-section)]"
      aria-label="프로세스"
    >
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <motion.div
          className="mb-32 text-center md:mb-48"
          style={{ opacity: titleOpacity, y: titleY }}
        >
          <h2
            className="font-serif font-bold leading-tight"
            style={{
              fontSize: "var(--text-display-md)",
              color: "var(--text-hero)",
            }}
          >
            <span className="block">단순 합성이 아닙니다.</span>
            <span className="block text-gradient">
              당신을 학습하는 시간, 20분
            </span>
          </h2>

          <p
            className="mx-auto mt-8 max-w-2xl font-sans text-lg leading-relaxed md:text-xl"
            style={{ color: "var(--text-body)" }}
          >
            Sdeume AI는 당신의 얼굴을 3D로 정밀하게 구현합니다.
            <br />
            진짜보다 더 진짜 같은 결과물, 잠시만 기다려주세요.
          </p>
        </motion.div>

        {/* 프로세스 스텝 */}
        <div className="mx-auto max-w-4xl">
          {processSteps.map((step, index) => (
            <ProcessStep
              key={step.number}
              step={step}
              index={index}
              isLast={index === processSteps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessStep({
  step,
  index,
  isLast,
}: {
  step: (typeof processSteps)[0];
  index: number;
  isLast: boolean;
}) {
  const stepRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stepRef,
    offset: ["start end", "center center"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const x = useTransform(scrollYProgress, [0, 0.5], [index % 2 === 0 ? -60 : 60, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);

  return (
    <motion.div
      ref={stepRef}
      className="relative mb-24 last:mb-0"
      style={{ opacity, x, scale }}
    >
      <div className="flex items-start gap-8">
        {/* 스텝 번호 */}
        <div className="flex-shrink-0">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full md:h-20 md:w-20"
            style={{
              background: `linear-gradient(135deg, var(--prism-pink), var(--prism-violet))`,
            }}
          >
            <span
              className="font-serif text-xl font-bold md:text-2xl"
              style={{ color: "var(--text-hero)" }}
            >
              {step.number}
            </span>
          </div>
        </div>

        {/* 스텝 콘텐츠 */}
        <div className="flex-1 pt-2">
          <h3
            className="font-serif text-2xl font-bold md:text-3xl"
            style={{ color: "var(--text-hero)" }}
          >
            {step.title}
          </h3>
          <p
            className="mt-3 font-sans text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-body)" }}
          >
            {step.description}
          </p>
        </div>
      </div>

      {/* 연결선 */}
      {!isLast && (
        <div
          className="absolute left-8 top-20 h-16 w-px md:left-10 md:top-24"
          style={{
            background: `linear-gradient(180deg, var(--prism-violet), transparent)`,
          }}
        />
      )}
    </motion.div>
  );
}
