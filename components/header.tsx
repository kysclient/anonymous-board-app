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
    <header className="m3-top-app-bar sticky top-0 z-50 w-full px-2 sm:px-4">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
          <Link
            href={"/dashboard"}
            className="flex items-center rounded-full px-2 py-1 transition-colors hover:bg-md-surface-container-high"
            aria-label="SPICY"
          >
            <Image
              src="/logo_v2/main_logo.png"
              alt="SPICY"
              width={172}
              height={40}
              priority
              sizes="172px"
              className="h-7 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <Link href="/investment" className="hidden sm:block">
            <button className="m3-btn m3-btn-text gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>투자</span>
            </button>
          </Link>
          <Link href="/investment" className="sm:hidden">
            <button
              className="m3-icon-btn"
              aria-label="투자 페이지"
              type="button"
            >
              <TrendingUp className="h-5 w-5 text-md-primary" />
            </button>
          </Link>

          <button
            type="button"
            className="m3-icon-btn"
            aria-label="테마 변경"
            onClick={() =>
              mounted && setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {mounted && !isAdmin && <AdminLoginDialog />}
        </div>
      </div>
    </header>
  );
}
