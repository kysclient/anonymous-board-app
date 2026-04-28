"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

/**
 * 투자 페이지 전용 헤더.
 * 검은 배경 + 심볼 로고만. (기존 SPICY 헤더와 분리)
 */
export function InvestmentHeader() {
  return (
    <header className="sticky top-0 z-50 h-14 bg-black border-b border-zinc-900 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-zinc-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">대시보드</span>
        </Link>
        <div className="w-px h-4 bg-zinc-800" />
        <Link href="/investment" className="flex items-center gap-2">
          <Image
            src="/investment/logo.png"
            alt="Investment"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        </Link>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
        <span className="hidden md:inline">기쁨 뒤에 슬픔이 오는 건 아름다운 마음이야</span>
      </div>
    </header>
  );
}
