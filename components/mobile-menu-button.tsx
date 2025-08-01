"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-context";

export function MobileMenuButton() {
  const { toggle } = useSidebar();

  return (
    <button className="md:hidden" onClick={toggle}>
      <Menu className="h-5 w-5 text-white" />
      <span className="sr-only">메뉴 열기</span>
    </button>
  );
}
