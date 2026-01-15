"use client";

import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: "사진 업로드",
    description: "갤러리에서 20~30장의 셀카를 한 번에 선택하세요.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
    ),
  },
  {
    number: 2,
    title: "AI 최적화",
    description: "AI가 사진을 자동으로 분석하고 최적화합니다.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
        />
      </svg>
    ),
  },
  {
    number: 3,
    title: "테마 선택",
    description: "원하는 스튜디오 테마를 선택하세요.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
        />
      </svg>
    ),
  },
  {
    number: 4,
    title: "AI 촬영",
    description: "AI가 학습 후 실시간으로 화보를 생성합니다.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
        />
      </svg>
    ),
  },
  {
    number: 5,
    title: "결과 확인",
    description: "완성된 웨딩 화보를 확인하고 다운로드하세요.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    ),
  },
];

interface StepCardProps extends Step {
  isLast: boolean;
}

function StepCard({ number, title, description, icon, isLast }: StepCardProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* 연결선 (데스크톱) */}
      {!isLast && (
        <div className="absolute left-[calc(50%+32px)] top-8 hidden h-0.5 w-[calc(100%-64px)] bg-[var(--color-line)] lg:block" />
      )}

      {/* 아이콘 원형 */}
      <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-desktop)] text-white shadow-[var(--shadow-sm)]">
        {icon}
        {/* 숫자 배지 */}
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-rose)] text-xs font-bold text-white">
          {number}
        </span>
      </div>

      {/* 텍스트 */}
      <h3 className="mb-2 font-serif text-lg font-semibold text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="max-w-[200px] text-center text-sm text-[var(--color-body)]">
        {description}
      </p>

      {/* 연결선 (모바일) */}
      {!isLast && (
        <div className="mt-4 h-8 w-0.5 bg-[var(--color-line)] lg:hidden" />
      )}
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-white py-16 md:py-24"
      aria-labelledby="how-heading"
    >
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <div className="mb-12 text-center">
          <h2
            id="how-heading"
            className="mb-4 font-serif text-3xl font-bold text-[var(--color-ink)] md:text-4xl"
          >
            어떻게 진행되나요?
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[var(--color-body)]">
            5단계로 완성되는 나만의 웨딩 화보
          </p>
        </div>

        {/* 스텝 카드 */}
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center lg:gap-8">
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              {...step}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
