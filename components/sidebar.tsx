"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Users,
  Gamepad2,
  Heart,
  Trophy,
  Sparkles,
  Image,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getAdminStatus } from "@/lib/actions";
import { useEffect, useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);

  const routes = [
    {
      label: "대시보드",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      hoverColor: "hover:bg-blue-500/20",
    },
    {
      label: "이상형 월드컵",
      icon: Trophy,
      href: "/dashboard/worldcup/profile",
      active: pathname.startsWith("/dashboard/worldcup"),
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      hoverColor: "hover:bg-pink-500/20",
      badge: "NEW",
    },
    {
      label: "이호준 솔로기원",
      icon: Sparkles,
      href: "/dashboard/hojun-solo",
      active: pathname.startsWith("/dashboard/hojun-solo"),
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      hoverColor: "hover:bg-rose-500/20",
      badge: "HOT",
    },
    {
      label: "짝짓기",
      icon: Heart,
      href: "/dashboard/mating",
      active: pathname === "/mating",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      hoverColor: "hover:bg-red-500/20",
    },
    {
      label: "갤러리",
      icon: Image,
      href: "/dashboard/gallery",
      active: pathname.startsWith("/dashboard/gallery"),
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      hoverColor: "hover:bg-emerald-500/20",
    },
    {
      label: "블랑 구경",
      icon: Image,
      href: "/dashboard/blanc",
      active: pathname.startsWith("/dashboard/blanc"),
      color: "text-emerald-500",
      bgColor: "bg-black/10",
      hoverColor: "hover:bg-black/20",
      adminOnly: true,
    },
    {
      label: "멤버관리",
      icon: Users,
      href: "/dashboard/users",
      active: pathname === "/dashboard/users",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      hoverColor: "hover:bg-purple-500/20",
      adminOnly: true,
    },
  ];

  useEffect(() => {
    const cookieStore = async () => {
      const status = await getAdminStatus();
      setIsAdmin(status);
    };

    cookieStore();
    return () => {
      setIsAdmin(false);
    };
  }, []);

  // 모바일용 사이드바 내용
  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-accent/5">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          스파이시 관리
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          멤버 통합 관리 시스템
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-2">
          {routes.map((route) => {
            if (route.adminOnly && !isAdmin) return null;
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={close}
                className={cn(
                  "flex items-center justify-between py-3 px-4 text-sm rounded-xl group transition-all duration-200",
                  route.active
                    ? `${route.bgColor} ${route.color} font-semibold shadow-sm`
                    : `text-muted-foreground ${route.hoverColor} hover:translate-x-1`
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      route.active ? route.bgColor : "bg-accent/50"
                    )}
                  >
                    {
                      route.href === '/dashboard/hojun-solo' ? (
                        <img src="/hojun.jpeg" className="overflow-hidden w-4 h-4 rounded-full" alt="hojun" />
                      )
                        :
                        <route.icon
                          className={cn(
                            "h-4 w-4",
                            route.active ? route.color : "text-muted-foreground"
                          )}
                        />
                    }
                  </div>
                  <span>{route.label}</span>
                </div>
                {route.badge && (
                  <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white animate-pulse">
                    {route.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* 모바일용 Sheet 사이드바 */}
      <Sheet open={isOpen} onOpenChange={close}>
        <SheetContent side="left" className="p-0 md:hidden">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* 데스크톱용 고정 사이드바 */}
      <div
        className={cn(
          "fixed left-0 top-16 z-40 hidden md:flex flex-col h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-background to-accent/5 border-r",
          className
        )}
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            스파이시 관리
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            멤버 통합 관리 시스템
          </p>
        </div>
        <div className="px-3 py-4 overflow-y-auto flex-1">
          <nav className="space-y-2">
            {routes.map((route) => {
              if (route.adminOnly && !isAdmin) return null;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center justify-between py-3 px-4 text-sm rounded-xl group transition-all duration-200",
                    route.active
                      ? `${route.bgColor} ${route.color} font-semibold shadow-sm`
                      : `text-muted-foreground ${route.hoverColor} hover:translate-x-1`
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        route.active ? route.bgColor : "bg-accent/50"
                      )}
                    >
                      {
                        route.href === '/dashboard/hojun-solo' ? (
                          <img src="/hojun.jpeg" className="overflow-hidden w-4 h-4 rounded-full" alt="hojun" />
                        )
                          :
                          <route.icon
                            className={cn(
                              "h-4 w-4",
                              route.active ? route.color : "text-muted-foreground"
                            )}
                          />
                      }
                    </div>
                    <span>{route.label}</span>
                  </div>
                  {route.badge && (
                    <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white animate-pulse">
                      {route.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
