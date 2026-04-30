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
    <nav className="space-y-1">
      {routes.map((route) => {
        if (route.adminOnly && !isAdmin) return null;
        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={close}
            data-selected={route.active}
            className={cn(
              "m3-nav-item group flex w-full justify-between gap-3",
              "h-12 px-4"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <route.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate type-label-large">{route.label}</span>
            </div>
            {route.badge && (
              <span
                className={cn(
                  "flex h-5 items-center rounded-full px-2 text-[10px] font-semibold tracking-wider",
                  route.badge === "NEW"
                    ? "bg-md-tertiary-container text-md-on-tertiary-container"
                    : "bg-md-surface-container-highest text-md-on-surface-variant"
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

  const sidebarContent = (
    <div className="flex h-full flex-col bg-md-surface-container">
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-6">
        <div className="space-y-1">
          <p className="px-4 pb-2 type-label-medium uppercase text-md-on-surface-variant">
            Workspace
          </p>
          {renderRoutes(mainRoutes)}
        </div>

        {isAdmin && (
          <div className="mt-6 space-y-1">
            <p className="px-4 pb-2 type-label-medium uppercase text-md-on-surface-variant">
              Archive
            </p>
            {renderRoutes(deactivatedRoutes)}
          </div>
        )}
      </div>

      <div className="border-t border-md-outline-variant px-5 py-4">
        <p className="type-label-small text-md-on-surface-variant">
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
          className="w-[300px] border-none bg-md-surface-container p-0 md:hidden"
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop drawer */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-[280px] flex-col bg-md-surface-container md:flex",
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
