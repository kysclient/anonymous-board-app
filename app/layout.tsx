import type React from "react";
import type { Metadata, Viewport } from "next";
import { Roboto_Flex, Roboto } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import "../styles/globals.css";

// Roboto Flex serves as the primary face for body / labels.
// We expose Google Sans aliases via CSS so headlines can target
// "Google Sans Display" / "Google Sans" and fall back to Roboto Flex
// for users without those licensed faces installed locally.
const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app",
  axes: ["opsz"],
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfbff" },
    { media: "(prefers-color-scheme: dark)", color: "#121317" },
  ],
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
        url: "/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "OG Image",
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
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${robotoFlex.variable} ${roboto.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
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
