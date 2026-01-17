"use client";

import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/scroll-reveal";

interface BeforeAfterItem {
  id: number;
  label: string;
}

const beforeAfterItems: BeforeAfterItem[] = [
  { id: 1, label: "사례 1" },
  { id: 2, label: "사례 2" },
  { id: 3, label: "사례 3" },
];

interface TrustBadge {
  icon: React.ReactNode;
  label: string;
}

const trustBadges: TrustBadge[] = [
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    label: "100% 환불 보장",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
    label: "개인정보 보호",
  },
  {
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    label: "빠른 처리",
  },
];

function BeforeAfterCard({ item }: { item: BeforeAfterItem }) {
  return (
    <div className="overflow-hidden">
      {/* 비포 & 애프터 이미지 영역 - subtle shadow로 float */}
      <div
        className="flex overflow-hidden rounded-lg"
        style={{
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Before */}
        <div className="relative flex-1">
          <div
            className="flex aspect-[4/5] items-center justify-center"
            style={{ backgroundColor: "var(--prism-blue)" }}
          >
            <span style={{ color: "var(--text-muted)" }} className="text-sm">
              Before
            </span>
          </div>
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            Before
          </span>
        </div>
        {/* After */}
        <div className="relative flex-1">
          <div
            className="flex aspect-[4/5] items-center justify-center"
            style={{ backgroundColor: "var(--prism-pink)" }}
          >
            <span style={{ color: "var(--text-muted)" }} className="text-sm">
              After
            </span>
          </div>
          <span
            className="absolute bottom-2 left-2 rounded px-2 py-0.5 text-xs text-white"
            style={{ backgroundColor: "var(--color-accent-rose)" }}
          >
            After
          </span>
        </div>
      </div>
      {/* 라벨 */}
      <div className="pt-4 text-center">
        <p className="text-sm font-medium" style={{ color: "var(--text-body)" }}>
          {item.label}
        </p>
      </div>
    </div>
  );
}

export function SocialProofSection() {
  return (
    <section
      className="py-[var(--space-section)]"
      aria-labelledby="proof-heading"
    >
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <ScrollReveal className="mb-16 text-center">
          <h2
            id="proof-heading"
            className="mb-4 font-serif font-bold"
            style={{
              fontSize: "var(--text-display-md)",
              color: "var(--text-hero)",
            }}
          >
            실제 사용자 결과물
          </h2>
          <p
            className="mx-auto max-w-2xl text-lg"
            style={{ color: "var(--text-body)" }}
          >
            일반 셀카가 하이엔드 웨딩 화보로 변신합니다
          </p>
        </ScrollReveal>

        {/* 비포 & 애프터 그리드 - Stagger Animation */}
        <StaggerContainer
          className="mb-16 grid gap-8 md:grid-cols-3"
          staggerDelay={0.12}
        >
          {beforeAfterItems.map((item) => (
            <StaggerItem key={item.id}>
              <BeforeAfterCard item={item} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* 신뢰 배지 - 배경 없음, 아이콘 + 텍스트만 */}
        <ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent-teal)" }}>
                  {badge.icon}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-hero)" }}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
