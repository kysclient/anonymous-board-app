"use client";

import Link from "next/link";
import Image from "next/image";
import { MobileMenuButton } from "./mobile-menu-button";
import { SpicyLogo } from "./spicy-logo";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getAdminStatus } from "@/lib/actions";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false)

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

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 flex h-16 border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
        <div className="flex flex-row justify-between w-full items-center">
          <div className="items-center gap-4 flex flex-row">
            <MobileMenuButton />
            <div className="flex flex-1 items-center gap-4 md:gap-6">
              <Link href={"/"}>
                <SpicyLogo />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Sun className="h-5 w-5" />
            </Button>
            <Link href="/">
              <Button className="rounded-xl" variant="secondary">
                관리자 로그인
              </Button>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
      <div className="flex flex-row justify-between w-full items-center">
        <div className="items-center gap-4 flex flex-row">
          <MobileMenuButton />
          <div className="flex flex-1 items-center gap-4 md:gap-6">
            <Link href={"/"}>
              <SpicyLogo />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          {
            !isAdmin &&
            <Link href="/">
              <Button className="rounded-xl" variant="secondary">
                관리자 로그인
              </Button>
            </Link>
          }
        </div>
      </div>
    </header>
  );
}
