"use client";

import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";
import { logoutAdmin } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function AdminHeader() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();

    // 시각적 피드백을 위해 약간의 지연 추가
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleLogout = () => {
    logoutAdmin();
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:items-center mb-6">
      <h1 className="text-xl sm:text-3xl font-bold">관리자 페이지</h1>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isRefreshing ? "새로고침 중" : "새로고침"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
