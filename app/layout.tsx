import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import '../styles/globals.css';
const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} `}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
