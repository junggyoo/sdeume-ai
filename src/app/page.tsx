import Script from "next/script";
import {
  ActIntroSection,
  ActValueSection,
  ActProcessSection,
  ActAtelierSection,
  ActRealitySection,
  FooterSection,
  generateFAQSchema,
} from "@/components/landing";
import { StickyCta } from "@/components/ui/sticky-cta";
import { MeshGradientBackground } from "@/components/ui/mesh-background";

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

      <MeshGradientBackground>
        <main className="min-h-dvh pb-[var(--spacing-safe-bottom)] md:pb-0">
          {/* Act 1: Hero - 스튜디오 없는 스튜디오 촬영 */}
          <ActIntroSection />

          {/* Act 2: Value - 어색한 미소 대신, 가장 나다운 표정으로 */}
          <ActValueSection />

          {/* Act 3: Process - 당신을 학습하는 시간, 20분 */}
          <ActProcessSection />

          {/* Act 4: Atelier - 빛의 아뜰리에 */}
          <ActAtelierSection />

          {/* Act 5: CTA - 당신의 인생 화보가 이곳에서 시작됩니다 */}
          <ActRealitySection />

          {/* Footer (FAQ 포함) */}
          <FooterSection />
        </main>
      </MeshGradientBackground>

      {/* 모바일 Sticky CTA */}
      <StickyCta href="/login" label="무료로 시작하기" />
    </>
  );
}
