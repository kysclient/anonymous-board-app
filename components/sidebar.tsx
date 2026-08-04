"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "모임일정",
      href: "/dashboard/schedule",
      active: pathname.startsWith("/dashboard/schedule"),
      badge: "New",
    },
    {
      label: "갤러리",
      href: "/dashboard/gallery",
      active: pathname.startsWith("/dashboard/gallery"),
    },
    {
      label: "온라인 오목",
      href: "/dashboard/omok",
      active: pathname.startsWith("/dashboard/omok"),
      badge: "Live",
    },
    {
      label: "흡연실",
      href: "/dashboard/smoking-room",
      active: pathname.startsWith("/dashboard/smoking-room"),
      badge: "Live",
    },
    {
      label: "통계",
      href: "/dashboard/stats",
      active: pathname.startsWith("/dashboard/stats"),
    },
    {
      label: "자리배치",
      href: "/dashboard/seating",
      active: pathname.startsWith("/dashboard/seating"),
      badge: "Latest",
    },
  ];

  const adminRoutes: RouteItem[] = [
    {
      label: "멤버관리",
      href: "/dashboard/users",
      active: pathname.startsWith("/dashboard/users"),
      adminOnly: true,
    },
    {
      label: "정산",
      href: "/dashboard/settlement",
      active: pathname.startsWith("/dashboard/settlement"),
      adminOnly: true,
    },
    {
      label: "우편함",
      href: "/deactivate/submit",
      active: pathname === "/deactivate/submit",
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
    <nav className="space-y-px">
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
              "group flex h-9 w-full items-center justify-between gap-2.5 rounded-[10px] px-3 text-[14px] transition-colors",
              active
                ? "bg-md-surface-container-high font-medium text-md-on-surface"
                : "font-normal text-md-on-surface-variant hover:bg-md-on-surface/[0.04] hover:text-md-on-surface"
            )}
          >
            <span className="truncate">{route.label}</span>
            {route.badge && <span className="xai-badge">{route.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const sectionLabel = (text: string) => (
    <p className="px-3 pb-2 text-[13px] font-semibold tracking-tight text-md-on-surface">
      {text}
    </p>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-6">
        <div>
          {sectionLabel("Workspace")}
          {renderRoutes(mainRoutes)}
        </div>

        {isAdmin && (
          <div className="mt-8">
            {sectionLabel("Admin")}
            {renderRoutes(adminRoutes)}
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        <p className="text-[11px] tracking-tight text-md-on-surface-variant/60">
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
          "fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-[248px] flex-col bg-md-surface md:flex",
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
