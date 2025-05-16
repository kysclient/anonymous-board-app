"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  totalCount?: number;
}

export default function Pagination({
  totalPages,
  currentPage,
  totalCount,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  function goToPage(page: number) {
    setIsNavigating(true);
    const params = new URLSearchParams();

    // 현재 searchParams의 모든 값을 새 params에 복사
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    params.set("page", page.toString());
    router.push(`/admin?${params.toString()}`);
  }

  // 페이지 번호 범위 계산 (최대 5개 표시)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  useEffect(() => {
    setIsNavigating(false);
  }, []);

  if (totalPages <= 1) {
    return (
      <div className="text-center text-sm text-muted-foreground mt-4">
        {totalCount !== undefined && <p>총 {totalCount}개의 게시물</p>}
      </div>
    );
  }
  return (
    <div className="space-y-2 mt-6">
      <div className="flex justify-center items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isNavigating}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(page)}
            className="w-9"
            disabled={isNavigating}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isNavigating}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {totalCount !== undefined && (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            총 {totalCount}개의 게시물 중 {currentPage} 페이지
          </p>
        </div>
      )}
    </div>
  );
}
