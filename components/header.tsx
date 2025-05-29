import Link from "next/link";
import Image from "next/image";
import { MobileMenuButton } from "./mobile-menu-button";

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b px-6"
      style={{
        background: "rgba(0,0,0,0.8)",
        boxShadow: "inset 0 -1px 0 0 #333333",
        backdropFilter: "saturate(180%) blur(5px)",
      }}
    >
      <MobileMenuButton />

      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <Link href={"/"}>
          <Image width={40} height={40} src="/logo.png" alt="logo" />
        </Link>
      </div>
    </header>
  );
}
