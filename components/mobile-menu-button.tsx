"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-context";

export function MobileMenuButton() {
  const { toggle } = useSidebar();

  return (
    <button
      type="button"
      className="m3-icon-btn md:hidden"
      onClick={toggle}
      aria-label="메뉴 열기"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
