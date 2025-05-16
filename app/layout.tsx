import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { getAdminStatus } from "@/lib/actions"
import { Tabs } from "@/components/tabs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "익명 게시판",
  description: "익명으로 글을 작성하고 볼 수 있는 게시판입니다.",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isAdmin = await getAdminStatus()

  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="container max-w-4xl py-10">
          <header className="mb-6">
            <h1 className="text-3xl font-bold mb-4">익명 게시판</h1>
            <Tabs isAdmin={isAdmin} />
          </header>
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
