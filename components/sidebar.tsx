"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Heart,
  Trophy,
  Sparkles,
  Image,
  Bomb,
  Calculator,
  Archive,
  FileText,
  ClipboardList,
  PenSquare,
  BarChart3,
  Hourglass,
  Armchair,
  MessageCircleHeart,
  Beer,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getAdminStatus } from "@/lib/actions";
import { useEffect, useState } from "react";

interface SidebarProps {
  className?: string;
}

interface RouteItem {
  label: string;
  icon: LucideIcon;
  href: string;
  active: boolean;
  badge?: string;
  adminOnly?: boolean;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);

  const mainRoutes: RouteItem[] = [
    {
      label: "대시보드",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "갤러리",
      icon: Image,
      href: "/dashboard/gallery",
      active: pathname.startsWith("/dashboard/gallery"),
    },
    {
      label: "술게임",
      icon: Beer,
      href: "/dashboard/drinking-game",
      active: pathname.startsWith("/dashboard/drinking-game"),
    },
    {
      label: "자리배치",
      icon: Heart,
      href: "/dashboard/mating",
      active: pathname.startsWith("/dashboard/mating"),
    },
    {
      label: "통계",
      icon: BarChart3,
      href: "/dashboard/stats",
      active: pathname.startsWith("/dashboard/stats"),
    },
    {
      label: "운세",
      icon: Sparkles,
      href: "/dashboard/fortune",
      active: pathname.startsWith("/dashboard/fortune"),
    },
    {
      label: "인생 시각화",
      icon: Hourglass,
      href: "/dashboard/life",
      active: pathname.startsWith("/dashboard/life"),
    },
    {
      label: "형래오빠 채팅",
      icon: MessageCircleHeart,
      href: "/dashboard/hyungrae-chat",
      active: pathname.startsWith("/dashboard/hyungrae-chat"),
    },
    {
      label: "자리배치 v2",
      icon: Armchair,
      href: "/dashboard/seating",
      active: pathname.startsWith("/dashboard/seating"),
    },
    {
      label: "멤버관리",
      icon: Users,
      href: "/dashboard/users",
      active: pathname.startsWith("/dashboard/users"),
      adminOnly: true,
    },
  ];

  const deactivatedRoutes: RouteItem[] = [
    {
      label: "정산",
      icon: Calculator,
      href: "/dashboard/settlement",
      active: pathname.startsWith("/dashboard/settlement"),
      badge: "OFF",
      adminOnly: true,
    },
    {
      label: "우편함",
      icon: PenSquare,
      href: "/deactivate/submit",
      active: pathname === "/deactivate/submit",
      badge: "OFF",
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
  const renderRoutes = (routes: RouteItem[]) => (
    <nav className="space-y-1">
      {routes.map((route) => {
        if (route.adminOnly && !isAdmin) return null;

        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={close}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors group",
              route.active
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                : "text-foreground/80 hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/40">
                <route.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    route.active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground group-hover:text-blue-500"
                  )}
                />
              </div>
              <span>{route.label}</span>
            </div>

            {route.badge && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground">
                {route.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background">

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        <div className="space-y-2">
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            활성 메뉴
          </p>
          {renderRoutes(mainRoutes)}
        </div>
        {
          isAdmin && (

            <div className="space-y-2">
              <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                비활성화 메뉴
              </p>
              {renderRoutes(deactivatedRoutes)}
            </div>
          )
        }
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
          "fixed left-0 top-16 z-40 hidden md:flex flex-col h-[calc(100vh-4rem)] w-64 border-r bg-background/95 backdrop-blur",
          className
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
