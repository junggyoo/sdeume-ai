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
import { MeshGradientBackground } from "@/components/ui/mesh-background";

export default function LandingPage() {
  const faqSchema = generateFAQSchema();

  return (
    <>
      {/* FAQ JSON-LD Schema */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <MeshGradientBackground>
        <main className="min-h-dvh">
          {/* Act 1: Hero - The Atelier of Dreams */}
          <ActIntroSection />

          {/* Act 2: Value - 우리는 촬영이 아닌 자유를 발명했다 */}
          <ActValueSection />

          {/* Act 3: Process - 3초의 마법 */}
          <ActProcessSection />

          {/* Act 4: Atelier - 당신의 감성을 담을 그릇들 */}
          <ActAtelierSection />

          {/* Act 5: Finale - 믿기지 않나요? */}
          <ActRealitySection />

          {/* Footer (FAQ included) */}
          <FooterSection />
        </main>
      </MeshGradientBackground>
    </>
  );
}
