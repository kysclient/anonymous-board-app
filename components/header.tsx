import Link from "next/link";
import Image from "next/image";
import { MobileMenuButton } from "./mobile-menu-button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6">
      <MobileMenuButton />

      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <Link href={"/"}>
          <Image width={40} height={40} src="/logo.png" alt="logo" />
        </Link>
      </div>
    </header>
  );
}
