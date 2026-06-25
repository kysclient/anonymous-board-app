"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Calculator,
  PenSquare,
  BarChart3,
  Armchair,
  Beer,
  CalendarDays,
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
      label: "모임일정",
      icon: CalendarDays,
      href: "/dashboard/schedule",
      active: pathname.startsWith("/dashboard/schedule"),
      badge: "NEW",
    },
    {
      label: "갤러리",
      icon: ImageIcon,
      href: "/dashboard/gallery",
      active: pathname.startsWith("/dashboard/gallery"),
    },
    {
      label: "술게임",
      icon: Beer,
      href: "/dashboard/drinking-game",
      active: pathname.startsWith("/dashboard/drinking-game"),
    },
    // {
    //   label: "자리배치",
    //   icon: Heart,
    //   href: "/dashboard/mating",
    //   active: pathname.startsWith("/dashboard/mating"),
    // },
    {
      label: "통계",
      icon: BarChart3,
      href: "/dashboard/stats",
      active: pathname.startsWith("/dashboard/stats"),
    },
    // {
    //   label: "운세",
    //   icon: Sparkles,
    //   href: "/dashboard/fortune",
    //   active: pathname.startsWith("/dashboard/fortune"),
    // },
    // {
    //   label: "인생 시각화",
    //   icon: Hourglass,
    //   href: "/dashboard/life",
    //   active: pathname.startsWith("/dashboard/life"),
    // },
    // {
    //   label: "형래오빠 채팅",
    //   icon: MessageCircleHeart,
    //   href: "/dashboard/hyungrae-chat",
    //   active: pathname.startsWith("/dashboard/hyungrae-chat"),
    // },
    {
      label: "자리배치 v2",
      icon: Armchair,
      href: "/dashboard/seating",
      active: pathname.startsWith("/dashboard/seating"),
      badge: "NEW",
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

  const renderRoutes = (routes: RouteItem[]) => (
    <nav className="space-y-0.5">
      {routes.map((route) => {
        if (route.adminOnly && !isAdmin) return null;
        const active = route.active;
        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={close}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex h-9 w-full items-center justify-between gap-2.5 rounded-lg px-2.5 text-[14px] tracking-[-0.01em] transition-colors",
              active
                ? "bg-black/[0.06] font-semibold text-md-on-surface dark:bg-white/[0.08]"
                : "font-medium text-md-on-surface-variant hover:bg-black/[0.035] hover:text-md-on-surface dark:hover:bg-white/[0.05]"
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <route.icon
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0",
                  active ? "text-spicy" : "text-current"
                )}
                strokeWidth={active ? 2.25 : 2}
              />
              <span className="truncate">{route.label}</span>
            </div>
            {route.badge && (
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  route.badge === "NEW"
                    ? "text-spicy"
                    : "text-md-on-surface-variant/50"
                )}
              >
                {route.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const sectionLabel = (text: string) => (
    <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-md-on-surface-variant/55">
      {text}
    </p>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col bg-md-surface">
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-5">
        <div>
          {sectionLabel("Workspace")}
          {renderRoutes(mainRoutes)}
        </div>

        {isAdmin && (
          <div className="mt-7">
            {sectionLabel("Archive")}
            {renderRoutes(deactivatedRoutes)}
          </div>
        )}
      </div>

      <div className="px-4 py-3.5">
        <p className="text-[11px] tracking-tight text-md-on-surface-variant/50">
          SPICY · v2026.04
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Sheet open={isOpen} onOpenChange={close}>
        <SheetContent
          side="left"
          className="w-[280px] border-none bg-md-surface p-0 md:hidden"
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop drawer */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-[280px] flex-col border-r border-md-outline-variant/70 bg-md-surface md:flex",
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
