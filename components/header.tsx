import Link from "next/link";
import Image from "next/image";
import { MobileMenuButton } from "./mobile-menu-button";
import { SpicyLogo } from "./spicy-logo";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 flex h-16 border-b px-6 bg-background w-full"
      style={
        {
          // background: "rgba(0,0,0,0.8)",
          // boxShadow: "inset 0 -1px 0 0 #333333",
          // backdropFilter: "saturate(180%) blur(5px)",
        }
      }
    >
      <div className="flex flex-row justify-between w-full items-center">
        <div className="items-center gap-4 justify-between">
          <MobileMenuButton />
          <div className="flex flex-1 items-center gap-4 md:gap-6">
            <Link href={"/"}>
              <SpicyLogo />
            </Link>
          </div>
        </div>
        <Link href="/">
          <Button className="rounded-xl" variant="secondary">관리자 로그인</Button>
        </Link>
      </div>
    </header>
  );
}
