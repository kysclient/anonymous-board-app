"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface MarqueeBannerProps {
  text: string;
  className?: string;
  speed?: "slow" | "normal" | "fast";
}

export default function MarqueeBanner({
  text,
  className,
  speed = "normal",
}: MarqueeBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 속도에 따른 애니메이션 지속 시간 설정
  const duration = {
    slow: "60s",
    normal: "30s",
    fast: "15s",
  };

  // 텍스트를 여러 번 반복하여 충분한 길이 확보
  const repeatedText = Array(40).fill(text).join(" ");

  return (
    <div
      className={cn(
        "w-full overflow-hidden bg-[#db4437] text-white py-2 font-bold sticky top-0 z-50",
        className
      )}
    >
      <div
        ref={containerRef}
        className="whitespace-nowrap inline-block animate-marquee"
        style={{
          animationDuration: duration[speed],
        }}
      >
        {repeatedText}
      </div>
    </div>
  );
}
