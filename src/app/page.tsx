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

			<main className="min-h-dvh bg-[var(--color-surface)] pb-[var(--spacing-safe-bottom)] md:pb-0">
				{/* Hero 섹션 */}
				<HeroSection />

				{/* UVP 섹션 */}
				<UvpSection />

				{/* How It Works 섹션 */}
				<HowItWorksSection />

				{/* 테마 프리뷰 섹션 */}
				<ThemePreviewSection />

				{/* 중간 CTA */}
				<section className="bg-white py-16 md:py-20">
					<div className="container mx-auto px-4 text-center">
						<h2 className="mb-4 font-serif text-2xl font-bold text-[var(--color-ink)] md:text-3xl">
							지금 바로 시작하세요
						</h2>
						<p className="mb-8 text-base text-[var(--color-body)]">
							스튜디오 촬영 없이도 하이엔드 웨딩 화보를 완성할 수 있습니다
						</p>
						<PrimaryCta href="/login" size="lg">
							무료로 시작하기
						</PrimaryCta>
					</div>
				</section>

				{/* Social Proof 섹션 */}
				<SocialProofSection />

				{/* Footer (FAQ 포함) */}
				<FooterSection />
			</main>

			{/* 모바일 Sticky CTA */}
			<StickyCta href="/login" label="무료로 시작하기" />
		</>
	);
}
