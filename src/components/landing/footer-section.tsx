import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "어떤 사진을 업로드해야 하나요?",
    answer:
      "정면, 반측면 등 다양한 각도의 셀카 20~30장을 업로드해주세요. 선글라스, 마스크 착용 사진은 피해주시고, 얼굴이 잘 보이는 사진을 선택해주세요.",
  },
  {
    question: "결과물이 마음에 들지 않으면 어떻게 하나요?",
    answer:
      "100% 환불 보장 정책을 운영합니다. 생성된 전체 이미지 중 본인 식별이 가능한 사진이 30% 미만일 경우, 전액 환불해드립니다.",
  },
  {
    question: "처리 시간은 얼마나 걸리나요?",
    answer:
      "AI 학습에 약 10~15분, 이미지 생성에 약 5분이 소요됩니다. 학습 중에는 앱을 닫고 편히 쉬셔도 되며, 촬영 시작 시 알림을 보내드립니다.",
  },
  {
    question: "업로드한 사진은 어떻게 처리되나요?",
    answer:
      "업로드된 사진은 AI 학습에만 사용되며, 서비스 완료 후 안전하게 삭제됩니다. 개인정보 보호를 위해 제3자와 공유하지 않습니다.",
  },
];

interface FooterLink {
  label: string;
  href: string;
}

const serviceLinks: FooterLink[] = [
  { label: "서비스 소개", href: "#how-it-works" },
  { label: "가격 안내", href: "/pricing" },
  { label: "FAQ", href: "#faq" },
];

const policyLinks: FooterLink[] = [
  { label: "이용약관", href: "/terms" },
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "환불정책", href: "/refund" },
];

export function FooterSection() {
  return (
    <footer className="bg-[var(--color-primary-desktop)] text-[var(--color-secondary)]">
      {/* FAQ 섹션 */}
      <section
        id="faq"
        className="border-b border-white/10 py-16 md:py-24"
        aria-labelledby="faq-heading"
      >
        <div className="container mx-auto px-4">
          <h2
            id="faq-heading"
            className="mb-8 text-center font-serif text-3xl font-bold md:text-4xl"
          >
            자주 묻는 질문
          </h2>

          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-[12px] border border-white/10 bg-white/5 px-4"
                >
                  <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[var(--color-secondary)]/80">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 푸터 링크 */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            {/* 로고 */}
            <div className="text-center md:text-left">
              <Link href="/" className="font-serif text-2xl font-bold">
                Sdeume AI
              </Link>
              <p className="mt-2 text-sm text-[var(--color-secondary)]/60">
                AI 기반 버추얼 웨딩 스튜디오
              </p>
            </div>

            {/* 링크 그룹 */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              {/* 서비스 */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]/60">
                  서비스
                </h3>
                <ul className="space-y-2">
                  {serviceLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--color-secondary)]/80 transition-colors hover:text-[var(--color-secondary)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 정책 */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]/60">
                  정책
                </h3>
                <ul className="space-y-2">
                  {policyLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--color-secondary)]/80 transition-colors hover:text-[var(--color-secondary)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 저작권 */}
          <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-[var(--color-secondary)]/40">
            <p>&copy; {new Date().getFullYear()} Sdeume AI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// FAQ JSON-LD 스키마 생성 함수
export function generateFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
