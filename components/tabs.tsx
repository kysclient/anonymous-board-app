"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabsProps {
  isAdmin: boolean;
}

export function Tabs({ isAdmin }: TabsProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex border-b mb-6">
      <Link
        href="/"
        className={cn(
          "px-4 py-2 font-medium",
          pathname === "/"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground"
        )}
      >
        게시물 작성
      </Link>

      <Link
        href="/survey"
        className={cn(
          "px-4 py-2 font-medium",
          pathname === "/survey"
            ? "border-b-2 border-primary text-primary"
            : "text-muted-foreground"
        )}
      >
        설문조사(벙)
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "px-4 py-2 font-medium",
            pathname === "/admin"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          )}
        >
          게시물 목록
        </Link>
      )}

      {isAdmin && (
        <Link
          href="/survey/list"
          className={cn(
            "px-4 py-2 font-medium",
            pathname === "/survey/list"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          )}
        >
          설문조사 목록
        </Link>
      )}
    </div>
  );
}
