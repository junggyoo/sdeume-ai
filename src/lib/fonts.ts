import { Noto_Serif_KR, Inter } from "next/font/google";

export const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
  preload: true,
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});
