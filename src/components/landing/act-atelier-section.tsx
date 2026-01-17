"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface AtelierTheme {
  id: string;
  name: string;
  emotionalName: string;
  tagline: string;
  accentColor: string;
}

const atelierThemes: AtelierTheme[] = [
  {
    id: "white",
    name: "화이트 스튜디오",
    emotionalName: "White Poem",
    tagline: "순백의 시, 빛으로 쓴 사랑의 언어.",
    accentColor: "var(--prism-pink)",
  },
  {
    id: "garden",
    name: "가든 스튜디오",
    emotionalName: "Garden Whisper",
    tagline: "쏟아지는 햇살과 바람의 속삭임. 영원히 지지 않는 봄.",
    accentColor: "var(--prism-blue)",
  },
  {
    id: "classic",
    name: "클래식 스튜디오",
    emotionalName: "Classic Legacy",
    tagline: "시간을 견뎌낸 우아함. 영화 속 주인공이 되는 순간.",
    accentColor: "var(--prism-violet)",
  },
];

/**
 * 테마 카드 컴포넌트 - True Borderless Design
 * 배경 박스 없이 텍스트와 은은한 데코만으로 구성
 */
function ThemeCard({
  theme,
  index,
}: {
  theme: AtelierTheme;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "center center"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [80, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);

  return (
    <motion.div
      ref={cardRef}
      className="relative group cursor-pointer py-12 md:py-16"
      style={{ opacity, y, scale }}
    >
      {/* 배경 데코 - 은은한 원형 (z-index: -1) */}
      <motion.div
        className="absolute -z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full blur-[80px] opacity-20 md:h-64 md:w-64"
        style={{ backgroundColor: theme.accentColor }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.5,
        }}
      />

      {/* 텍스트 콘텐츠 - 중앙 정렬 */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* 테마 번호 */}
        <p
          className="text-xs font-medium uppercase tracking-[0.3em] mb-4"
          style={{ color: "#111827" }}
        >
          Atelier {String(index + 1).padStart(2, "0")}
        </p>

        {/* 테마 이름 - 대형 타이포 */}
        <h4
          className="font-serif text-4xl font-bold md:text-5xl lg:text-6xl floating-text tracking-tight"
          style={{ color: "#111827" }}
        >
          {theme.emotionalName}
        </h4>

        {/* 태그라인 */}
        <motion.p
          className="mt-6 max-w-sm text-base leading-relaxed md:text-lg font-normal"
          style={{ color: "#111827" }}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
        >
          {theme.tagline}
        </motion.p>

        {/* 호버 시 나타나는 악센트 라인 */}
        <motion.div
          className="mt-8 h-px w-16 transition-all duration-500 group-hover:w-32"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.accentColor}, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}

/**
 * Act 4: The Atelier (아뜰리에)
 *
 * Borderless 디자인의 테마 갤러리.
 * 카드/테두리 없이 텍스트가 배경 위에 부유하는 느낌.
 */
export function ActAtelierSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.3], [60, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative py-[var(--space-section)]"
      aria-label="아뜰리에"
    >
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <motion.div
          className="mb-32 text-center md:mb-48"
          style={{ y: titleY, opacity: titleOpacity }}
        >
          <p
            className="mb-4 font-sans text-sm uppercase tracking-[0.3em] md:text-base"
            style={{ color: "var(--text-muted)" }}
          >
            The Atelier
          </p>
          <h2
            className="font-serif font-bold leading-tight"
            style={{
              fontSize: "var(--text-display-md)",
              color: "var(--text-hero)",
            }}
          >
            <span className="block">당신만의</span>
            <span className="block text-gradient">빛의 아뜰리에</span>
          </h2>
          <p
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-body)" }}
          >
            세 가지 빛의 여정 중, 당신의 마음이 머무는 곳을 선택하세요.
          </p>
        </motion.div>

        {/* 테마 갤러리 - Borderless Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {atelierThemes.map((theme, index) => (
            <ThemeCard key={theme.id} theme={theme} index={index} />
          ))}
        </div>

        {/* 하단 카피 */}
        <motion.p
          className="mt-20 text-center font-serif text-lg italic md:mt-32 md:text-xl floating-text"
          style={{ color: "var(--text-muted)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          &ldquo;어떤 빛 아래에서도, 당신은 아름답습니다.&rdquo;
        </motion.p>
      </div>
    </section>
  );
}
