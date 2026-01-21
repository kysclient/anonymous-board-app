import type React from "react";
import { getAdminStatus } from "@/lib/actions";
import { Tabs } from "@/components/tabs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdmin = await getAdminStatus();

  return (
    <div>
      <div className="container max-w-4xl py-10 mx-auto px-4">
        <header className="mb-6">
          {isAdmin && (
            <Link
              href={"/dashboard"}
              className="my-4 text-blue-500 font-semibold flex flex-row items-center gap-2"
            >
              대시보드 바로가기
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <h1 className="text-3xl font-bold mb-4">
            스파이시 익명우편함 💌 - 비활성화 25.05.21
          </h1>
          <Tabs isAdmin={isAdmin} />
        </header>
        {children}
      </div>
    </div>
  );
}

