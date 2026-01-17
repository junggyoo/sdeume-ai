"use client";

import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";

interface Step {
  number: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: "사진 업로드",
    description: "갤러리에서 20~30장의 셀카를 한 번에 선택하세요.",
  },
  {
    number: 2,
    title: "AI 최적화",
    description: "AI가 사진을 자동으로 분석하고 최적화합니다.",
  },
  {
    number: 3,
    title: "테마 선택",
    description: "원하는 스튜디오 테마를 선택하세요.",
  },
  {
    number: 4,
    title: "AI 촬영",
    description: "AI가 학습 후 실시간으로 화보를 생성합니다.",
  },
  {
    number: 5,
    title: "결과 확인",
    description: "완성된 웨딩 화보를 확인하고 다운로드하세요.",
  },
];

interface StepCardProps extends Step {
  isLast: boolean;
}

function StepCard({ number, title, description, isLast }: StepCardProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* 연결선 (데스크톱) - Dashed */}
      {!isLast && (
        <div
          className="absolute left-[calc(50%+48px)] top-12 hidden h-0 w-[calc(100%-96px)] border-t-2 border-dashed lg:block"
          style={{ borderColor: "var(--text-muted)", opacity: 0.3 }}
        />
      )}

      {/* 거대한 스텝 번호 */}
      <div className="relative z-10 mb-4">
        <span
          className="font-serif font-bold"
          style={{
            fontSize: "var(--text-display-md)",
            color: "var(--color-accent-rose)",
            lineHeight: 1,
          }}
        >
          {String(number).padStart(2, "0")}
        </span>
      </div>

      {/* 텍스트 */}
      <h3
        className="mb-2 font-serif text-xl font-semibold"
        style={{ color: "var(--text-hero)" }}
      >
        {title}
      </h3>
      <p
        className="max-w-[200px] text-center text-sm"
        style={{ color: "var(--text-body)" }}
      >
        {description}
      </p>

      {/* 연결선 (모바일) - Dashed */}
      {!isLast && (
        <div
          className="mt-6 h-8 w-0 border-l-2 border-dashed lg:hidden"
          style={{ borderColor: "var(--text-muted)", opacity: 0.3 }}
        />
      )}
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-[var(--space-section)]"
      aria-labelledby="how-heading"
    >
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <ScrollReveal className="mb-16 text-center">
          <h2
            id="how-heading"
            className="mb-4 font-serif font-bold"
            style={{
              fontSize: "var(--text-display-md)",
              color: "var(--text-hero)",
            }}
          >
            어떻게 진행되나요?
          </h2>
          <p className="mx-auto max-w-2xl text-lg" style={{ color: "var(--text-body)" }}>
            5단계로 완성되는 나만의 웨딩 화보
          </p>
        </ScrollReveal>

        {/* 스텝 카드 - Stagger Animation */}
        <StaggerContainer
          className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-8"
          staggerDelay={0.1}
        >
          {steps.map((step, index) => (
            <StaggerItem key={step.number}>
              <StepCard {...step} isLast={index === steps.length - 1} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
