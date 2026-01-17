"use client";

import { PrimaryCta } from "@/components/ui/primary-cta";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function HeroSection() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden">
      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {/* 서브타이틀 */}
        <ScrollReveal delay={0}>
          <p
            className="mb-6 font-sans text-sm font-medium tracking-wide md:text-base"
            style={{ color: "var(--text-muted)" }}
          >
            AI 기반 버추얼 웨딩 스튜디오
          </p>
        </ScrollReveal>

        {/* 메인 타이틀 - Giant Typography */}
        <ScrollReveal delay={0.1}>
          <h1
            className="mb-8 font-serif font-bold leading-[0.95] tracking-tight"
            style={{
              fontSize: "var(--text-display-hero)",
              color: "var(--text-hero)",
            }}
          >
            <span className="block">스튜디오 없이도</span>
            <span
              className="block"
              style={{ color: "var(--color-accent-rose)" }}
            >
              하이엔드 웨딩 화보
            </span>
          </h1>
        </ScrollReveal>

        {/* 설명 */}
        <ScrollReveal delay={0.2}>
          <p
            className="mx-auto mb-12 max-w-xl font-sans text-lg leading-relaxed md:text-xl"
            style={{ color: "var(--text-body)" }}
          >
            집에서 촬영하듯 온라인으로 웨딩 화보를 즉시 생성.
            <br className="hidden sm:block" />
            스드메 준비의 스트레스를 0으로 만들어 드립니다.
          </p>
        </ScrollReveal>

        {/* CTA 버튼들 - Liquid Glass */}
        <ScrollReveal delay={0.3}>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <PrimaryCta href="/login" size="xl" variant="liquidGlassPrimary">
              무료로 시작하기
            </PrimaryCta>
            <PrimaryCta href="#how-it-works" size="xl" variant="liquidGlass">
              서비스 알아보기
            </PrimaryCta>
          </div>
        </ScrollReveal>

        {/* 신뢰 지표 - 배경 원형 제거, 텍스트만 float */}
        <ScrollReveal delay={0.4}>
          <div
            className="mt-16 flex items-center justify-center gap-2 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <svg
              className="h-4 w-4"
              style={{ color: "var(--color-accent-teal)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>100% 환불 보장</span>
            <span className="mx-2 opacity-50">·</span>
            <span>결제 전 미리보기 제공</span>
          </div>
        </ScrollReveal>
      </div>

      {/* 스크롤 힌트 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="h-6 w-6"
          style={{ color: "var(--text-muted)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
