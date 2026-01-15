"use client";

import { PrimaryCta } from "@/components/ui/primary-cta";

export function HeroSection() {
	return (
		<section className="relative isolate min-h-[90vh] overflow-hidden bg-[var(--color-secondary)] md:min-h-screen">
			{/* Aurora 텍스처 배경 */}
			<div
				className="pointer-events-none absolute inset-0 -z-10 motion-safe:animate-[aurora-float_8s_ease-in-out_infinite_alternate]"
				aria-hidden="true"
			>
				{/* Teal 오로라 레이어 */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(134,227,255,0.08),transparent)]" />
				{/* Lilac 오로라 레이어 */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_50%,rgba(199,185,255,0.06),transparent)]" />
				{/* Warm Glow 레이어 */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_80%,rgba(255,214,165,0.06),transparent)]" />
				{/* 기본 그라디언트 */}
				<div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-secondary)_0%,var(--color-surface)_100%)]" />
			</div>

			<div className="container mx-auto flex min-h-[90vh] flex-col items-center justify-center px-4 text-center md:min-h-screen">
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
				<div className="flex flex-col gap-4 sm:flex-row">
					<PrimaryCta href="/login" size="lg">
						무료로 시작하기
					</PrimaryCta>
					<PrimaryCta href="#how-it-works" size="lg" variant="secondary">
						서비스 알아보기
					</PrimaryCta>
				</div>

				{/* 신뢰 지표 */}
				<div className="mt-12 flex items-center gap-2 text-sm text-[var(--color-sub)]">
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
