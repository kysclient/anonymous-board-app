import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "강남구 지역 모임 - 🔥SPICY🔥 외모커트라인 높아요❤️",
  description: "지루한 일상 속 매운맛🌶️을 느끼고 싶다면",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    images: [
      {
        url: "/og-image.jpeg", // OG 이미지 경로
        width: 1200,
        height: 630,
        alt: "OG Image", // OG 이미지 설명
      },
    ],
  },
  keywords: ["소모임", "스파이시", "윈터"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} `}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
