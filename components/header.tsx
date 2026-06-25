"use client";

import Link from "next/link";
import Image from "next/image";
import { MobileMenuButton } from "./mobile-menu-button";
import { Moon, Sun, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getAdminStatus } from "@/lib/actions";
import { AdminLoginDialog } from "@/components/admin-login-dialog";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const cookieStore = async () => {
      const status = await getAdminStatus();
      setIsAdmin(status);
    };
    setMounted(true);
    cookieStore();
    return () => {
      setIsAdmin(false);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center border-b border-md-outline-variant/70 bg-md-surface/75 px-3 backdrop-blur-xl backdrop-saturate-150 sm:px-5">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center">
          <MobileMenuButton />
          <Link
            href={"/dashboard"}
            className="flex items-center rounded-lg"
            aria-label="SPICY"
          >
            <Image
              src={theme === 'dark' ? '/logo_v3/logo_light.png' : '/logo_v3/logo_dark.png'}
              alt="SPICY"
              width={230}
              height={74}
              priority
              sizes="230px"
              className="h-7 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center gap-0.5">
          <Link
            href="/investment"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-md-on-surface-variant transition-colors hover:bg-black/[0.04] hover:text-md-on-surface dark:hover:bg-white/[0.06] sm:inline-flex"
          >
            <TrendingUp className="h-4 w-4" />
            투자
          </Link>
          <Link
            href="/investment"
            className="flex h-9 w-9 items-center justify-center rounded-full text-md-on-surface-variant transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] sm:hidden"
            aria-label="투자 페이지"
          >
            <TrendingUp className="h-[18px] w-[18px]" />
          </Link>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-md-on-surface-variant transition-colors hover:bg-black/[0.04] hover:text-md-on-surface dark:hover:bg-white/[0.06]"
            aria-label="테마 변경"
            onClick={() =>
              mounted && setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          {mounted && !isAdmin && <AdminLoginDialog />}
        </div>
      </div>
    </header>
  );
}
