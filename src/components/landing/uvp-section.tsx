"use client";

import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";

interface UvpItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const uvpItems: UvpItem[] = [
  {
    icon: (
      <svg
        className="h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
        />
      </svg>
    ),
    title: "스트레스 해소",
    description:
      "복잡한 스드메 준비, 이제 스트레스 없이. 시간과 장소의 제약 없이 집에서 편하게 시작하세요.",
  },
  {
    icon: (
      <svg
        className="h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
    ),
    title: "서브 앨범 솔루션",
    description:
      "못 해본 컨셉, AI로 채우는 2% 아쉬움. 제주도 야외, 한복 컷 등 원하던 컨셉을 추가하세요.",
  },
  {
    icon: (
      <svg
        className="h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
    title: "주체적 디렉팅",
    description:
      "정해진 포즈가 아닌, 내가 원하는 분위기와 배경을 선택하는 주체적 경험을 제공합니다.",
  },
];

interface UvpCardProps extends UvpItem {
  className?: string;
}

function UvpCard({ icon, title, description }: UvpCardProps) {
  return (
    <div className="group flex flex-col items-center text-center">
      {/* 아이콘 - 배경 원형 제거, 색상만 유지 */}
      <div
        className="mb-6 transition-transform duration-300 group-hover:scale-110"
        style={{ color: "var(--color-accent-rose)" }}
      >
        {icon}
      </div>
      <h3
        className="mb-3 font-serif font-semibold"
        style={{
          fontSize: "var(--text-display-sm)",
          color: "var(--text-hero)",
          lineHeight: 1.1,
        }}
      >
        {title}
      </h3>
      <p
        className="max-w-xs text-base leading-relaxed"
        style={{ color: "var(--text-body)" }}
      >
        {description}
      </p>
    </div>
  );
}

export function UvpSection() {
  return (
    <section
      className="py-[var(--space-section)]"
      aria-labelledby="uvp-heading"
    >
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <ScrollReveal className="mb-16 text-center">
          <h2
            id="uvp-heading"
            className="mb-4 font-serif font-bold"
            style={{
              fontSize: "var(--text-display-md)",
              color: "var(--text-hero)",
            }}
          >
            왜 스드메 AI인가요?
          </h2>
          <p
            className="mx-auto max-w-2xl text-lg"
            style={{ color: "var(--text-body)" }}
          >
            스튜디오 촬영의 한계를 넘어, AI가 만드는 새로운 웨딩 경험
          </p>
        </ScrollReveal>

        {/* UVP 카드 그리드 - Stagger Animation */}
        <StaggerContainer
          className="grid gap-[var(--space-element)] md:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.15}
        >
          {uvpItems.map((item, index) => (
            <StaggerItem key={index}>
              <UvpCard {...item} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
