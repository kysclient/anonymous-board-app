import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminStatus, getPosts } from "@/lib/actions";
import PostList from "@/components/post-list";
import AdminHeader from "@/components/admin-header";
import SearchForm from "@/components/search-form";
import LoadingSpinner from "@/components/loading-spinner";
import type { SearchParams } from "@/lib/types";
import { DynamicPagination } from "@/components/csr-wrapper";

interface AdminPageProps {
  searchParams: Promise<{
    page?: string;
    searchType?: string;
    searchQuery?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // 관리자 권한 확인
  const isAdmin = await getAdminStatus();

  if (!isAdmin) {
    redirect("/");
  }

  // searchParams를 await로 기다림
  const params = await searchParams;

  // 페이지 번호 가져오기
  const page = params.page ? Number.parseInt(params.page) : 1;

  // 검색 파라미터 가져오기
  let search: SearchParams | undefined;

  if (params.searchType && params.searchQuery) {
    search = {
      searchType: params.searchType as "title" | "content" | "ip",
      searchQuery: params.searchQuery,
    };
  }

  // 게시물 목록 가져오기
  const {
    data: posts,
    totalPages,
    currentPage,
    totalCount,
  } = await getPosts(page, search);

  // 검색 결과 메시지 생성
  let searchResultMessage = "";
  if (search) {
    const searchTypeText =
      search.searchType === "title"
        ? "제목"
        : search.searchType === "content"
        ? "내용"
        : "IP 주소";

    searchResultMessage = `"${search.searchQuery}"에 대한 ${searchTypeText} 검색 결과`;
  }

  return (
    <main>
      <AdminHeader />
      <Suspense
        fallback={<LoadingSpinner message="검색 폼을 불러오는 중..." />}
      >
        <SearchForm />
      </Suspense>

      {searchResultMessage && (
        <div className="mb-4 p-2 bg-muted rounded-md text-center">
          <p>{searchResultMessage}</p>
        </div>
      )}

      <Suspense fallback={<LoadingSpinner message="게시물을 불러오는 중..." />}>
        <PostList posts={posts} />
        <DynamicPagination
          totalPages={totalPages}
          currentPage={currentPage}
          totalCount={totalCount}
        />
      </Suspense>
    </main>
  );
}
