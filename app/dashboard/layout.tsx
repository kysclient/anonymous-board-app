import type React from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/components/sidebar-context";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "멤버 관리",
  description: "스파이시 멤버 통합관리 툴입니다.",
  generator: "kim yu shin",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-md-surface-container">
        <Header />
        <div className="flex flex-1">
          <Sidebar className="hidden md:block" />
          <main className="flex-1 overflow-y-auto bg-md-surface-container md:ml-[280px]">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
