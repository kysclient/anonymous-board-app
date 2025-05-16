"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "./loading-spinner";
import { useEffect, useState } from "react";

const Pagination = dynamic(() => import("@/components/pagination"), {
  loading: () => <LoadingSpinner message="페이지네이션을 불러오는 중..." />,
  ssr: false, // 서버 사이드 렌더링 비활성화
});

interface DynamicPagination {
  totalCount: number | undefined;
  currentPage: number;
  totalPages: number;
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * 서버 사이드 렌더링 비활성화하여 클라이언트에서만 페이지네이션을 로드하는 컴포넌트.
 * @param {{ children: ReactNode }} props

 * @prop {ReactNode} children 페이지네이션을 감싸는 컴포넌트. totalCount, totalPages, currentPage를 props로 내려받게 된다.
 * @returns {ReactElement} 페이지네이션 컴포넌트.
 */
export function DynamicPagination({
  totalCount,
  totalPages,
  currentPage,
}: DynamicPagination) {
  const [mouted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  });
  if(!mouted) return null
  return (
    <Pagination
      totalPages={totalPages}
      currentPage={currentPage}
      totalCount={totalCount}
    />
  );
}
