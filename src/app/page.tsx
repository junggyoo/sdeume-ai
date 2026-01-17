import Script from "next/script";
import {
  HeroSection,
  UvpSection,
  HowItWorksSection,
  ThemePreviewSection,
  SocialProofSection,
  FooterSection,
  generateFAQSchema,
} from "@/components/landing";
import { PrimaryCta } from "@/components/ui/primary-cta";
import { StickyCta } from "@/components/ui/sticky-cta";
import { PrismaticBackground } from "@/components/ui/prismatic-background";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PearlDustWrapper } from "@/components/ui/pearl-dust-wrapper";

export default function LandingPage() {
  const faqSchema = generateFAQSchema();

  return (
    <>
      {/* FAQ JSON-LD 스키마 */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PrismaticBackground>
        {/* Pearl Dust Particle Canvas */}
        <PearlDustWrapper particleCount={60} />

        <main className="min-h-dvh pb-[var(--spacing-safe-bottom)] md:pb-0">
          {/* Hero 섹션 */}
          <HeroSection />

          {/* UVP 섹션 */}
          <UvpSection />

          {/* How It Works 섹션 */}
          <HowItWorksSection />

          {/* 테마 프리뷰 섹션 */}
          <ThemePreviewSection />

          {/* 중간 CTA - 배경 제거, giant typography */}
          <section className="py-[var(--space-section)]">
            <div className="container mx-auto px-4 text-center">
              <ScrollReveal>
                <h2
                  className="mb-6 font-serif font-bold"
                  style={{
                    fontSize: "var(--text-display-md)",
                    color: "var(--text-hero)",
                  }}
                >
                  지금 바로 시작하세요
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p
                  className="mb-10 text-lg"
                  style={{ color: "var(--text-body)" }}
                >
                  스튜디오 촬영 없이도 하이엔드 웨딩 화보를 완성할 수 있습니다
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <PrimaryCta href="/login" size="xl" variant="liquidGlassPrimary">
                  무료로 시작하기
                </PrimaryCta>
              </ScrollReveal>
            </div>
          </section>

          {/* Social Proof 섹션 */}
          <SocialProofSection />

          {/* Footer (FAQ 포함) - 어두운 테마 유지 */}
          <FooterSection />
        </main>
      </PrismaticBackground>

      {/* 모바일 Sticky CTA */}
      <StickyCta href="/login" label="무료로 시작하기" />
    </>
  );
}
