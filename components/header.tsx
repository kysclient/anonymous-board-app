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
  const { resolvedTheme, setTheme } = useTheme();
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
    <header className="sticky top-0 z-50 flex h-16 w-full items-center bg-md-surface/80 px-3 backdrop-blur-xl sm:px-6">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <MobileMenuButton />
          <Link
            href={"/dashboard"}
            className="flex items-center rounded-lg"
            aria-label="SPICY"
          >
            <Image
              src="/logo_v3/logo_dark.png"
              alt="SPICY"
              width={230}
              height={74}
              priority
              sizes="230px"
              className="h-7 w-auto object-contain dark:hidden"
            />
            <Image
              src="/logo_v3/logo_light.png"
              alt="SPICY"
              width={230}
              height={74}
              priority
              sizes="230px"
              className="hidden h-7 w-auto object-contain dark:block"
            />
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/investment"
            className="hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-normal text-md-on-surface-variant transition-colors hover:bg-md-on-surface/[0.05] hover:text-md-on-surface sm:inline-flex"
          >
            <TrendingUp className="h-4 w-4" />
            투자
          </Link>
          <Link
            href="/investment"
            className="flex h-9 w-9 items-center justify-center rounded-full text-md-on-surface-variant transition-colors hover:bg-md-on-surface/[0.05] sm:hidden"
            aria-label="투자 페이지"
          >
            <TrendingUp className="h-[18px] w-[18px]" />
          </Link>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-md-on-surface-variant transition-colors hover:bg-md-on-surface/[0.05] hover:text-md-on-surface"
            aria-label="테마 변경"
            onClick={() =>
              mounted && setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {mounted && resolvedTheme === "dark" ? (
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
