"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Users, Gamepad2, Heart } from "lucide-react";

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
    },
    // {
    //   label: "미니게임",
    //   icon: Gamepad2,
    //   href: "/dashboard/games",
    //   active: pathname === "/dashboard/games",
    // },
    {
      label: "짝짓기",
      icon: Heart,
      href: "/mating",
      active: pathname === "/mating",
    },
    {
      label: "멤버관리",
      icon: Users,
      href: "/dashboard/users",
      active: pathname === "/dashboard/users",
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {routes.map((route) => {
            if (route.href === "/dashboard/users" && !isAdmin) return;
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={close}
                className={cn(
                  "flex items-center py-2 px-3 text-sm rounded-md group hover:bg-accent",
                  route.active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <route.icon className={cn("h-4 w-4 mr-2")} />
                {route.label}
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
          "fixed left-0 top-16 z-40 hidden md:flex flex-col h-[calc(100vh-4rem)] w-64 bg-background border-r",
          className
        )}
      >
        <div className="px-3 py-4 overflow-y-auto flex-1">
          <nav className="space-y-1">
            {routes.map((route) => {
              if (route.href === "/dashboard/users" && !isAdmin) return;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center py-2 px-3 text-sm rounded-md group hover:bg-accent",
                    route.active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <route.icon className={cn("h-4 w-4 mr-2")} />
                  {route.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
