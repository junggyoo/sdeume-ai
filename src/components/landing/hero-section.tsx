"use client";

import dynamic from "next/dynamic";
import { PrimaryCta } from "@/components/ui/primary-cta";

// Dynamic import for AuroraBackground (SSR excluded for performance)
const AuroraBackground = dynamic(
	() =>
		import("@/components/ui/aurora/AuroraBackground").then(
			(mod) => mod.AuroraBackground,
		),
	{ ssr: false },
);

export function HeroSection() {
	return (
		<section className="relative isolate min-h-[90vh] overflow-hidden bg-[var(--color-secondary)] md:min-h-screen">
			{/* Romantic Tech Aurora Background */}
			<AuroraBackground
				hue="romantic"
				intensity={0.6}
				className="-z-10"
			/>

			{/* Base gradient overlay for contrast */}
			<div
				className="pointer-events-none absolute inset-0 -z-10"
				aria-hidden="true"
				style={{
					background:
						"linear-gradient(180deg, var(--color-secondary) 0%, var(--color-surface) 100%)",
				}}
			/>

			<div className="container mx-auto flex min-h-[90vh] flex-col items-center justify-center px-4 text-center md:min-h-screen">
				{/* Glassmorphism Card for content */}
				<div
					className="relative rounded-2xl px-8 py-12 md:px-16 md:py-16"
					style={{
						background: "var(--glass-bg)",
						backdropFilter: "blur(var(--glass-blur))",
						WebkitBackdropFilter: "blur(var(--glass-blur))",
						border: "1px solid var(--glass-border)",
						boxShadow: "var(--glass-shadow)",
					}}
				>
					{/* 서브타이틀 */}
					<p className="mb-4 font-sans text-sm font-medium tracking-wide text-[var(--color-sub)] md:text-base">
						AI 기반 버추얼 웨딩 스튜디오
					</p>

					{/* 메인 타이틀 */}
					<h1 className="mb-6 font-serif text-4xl font-bold leading-tight tracking-tight text-[var(--color-ink)] md:text-5xl lg:text-6xl">
						<span className="block">스튜디오 없이도</span>
						<span className="block text-[var(--color-accent-rose)]">
							하이엔드 웨딩 화보
						</span>
					</h1>

					{/* 설명 */}
					<p className="mb-10 max-w-xl font-sans text-base leading-relaxed text-[var(--color-body)] md:text-lg">
						집에서 촬영하듯 온라인으로 웨딩 화보를 즉시 생성.
						<br className="hidden sm:block" />
						스드메 준비의 스트레스를 0으로 만들어 드립니다.
					</p>

					{/* CTA 버튼들 */}
					<div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
						<PrimaryCta href="/login" size="lg">
							무료로 시작하기
						</PrimaryCta>
						<PrimaryCta href="#how-it-works" size="lg" variant="secondary">
							서비스 알아보기
						</PrimaryCta>
					</div>

					{/* 신뢰 지표 */}
					<div className="mt-12 flex items-center justify-center gap-2 text-sm text-[var(--color-sub)]">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent-teal)]/10">
							<svg
								className="h-3 w-3 text-[var(--color-accent-teal)]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={3}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</span>
						<span>100% 환불 보장</span>
						<span className="mx-2">·</span>
						<span>결제 전 미리보기 제공</span>
					</div>
				</div>
			</div>

			{/* 스크롤 힌트 */}
			<div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
				<svg
					className="h-6 w-6 text-[var(--color-sub)]"
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
