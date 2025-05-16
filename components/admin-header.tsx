"use client";

import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";
import { logoutAdmin } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-xl sm:text-3xl font-bold">관리자 페이지</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
        <Button variant="outline" size="sm" onClick={() => logoutAdmin()}>
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
