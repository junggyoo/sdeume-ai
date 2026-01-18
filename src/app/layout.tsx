import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";
import { Toaster } from "@/components/ui/toaster";

const notoSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["200", "400", "600", "900"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sdeume AI | AI 웨딩 화보 스튜디오",
  description:
    "집에서 촬영하듯 온라인으로 웨딩 화보를 즉시 생성. 스튜디오 없이도 하이엔드 웨딩 사진을 만나보세요.",
  keywords: ["AI 웨딩 사진", "버추얼 스튜디오", "웨딩 화보", "모바일 청첩장"],
  openGraph: {
    title: "Sdeume AI | AI 웨딩 화보 스튜디오",
    description:
      "스드메 준비의 스트레스를 0으로. AI로 완성하는 나만의 웨딩 화보.",
    type: "website",
    locale: "ko_KR",
    url: "https://sdeume.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sdeume AI | AI 웨딩 화보 스튜디오",
    description: "AI 기반 버추얼 웨딩 스튜디오",
  },
  alternates: {
    canonical: "https://sdeume.ai",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${notoSerif.variable}`}
    >
      <body className="antialiased font-serif bg-deep-navy text-foreground selection:bg-champagne-gold selection:text-deep-navy">
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            {children}
          </CurrentUserProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
