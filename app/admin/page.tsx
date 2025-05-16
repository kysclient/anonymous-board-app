import { redirect } from "next/navigation"
import { getAdminStatus, getPosts } from "@/lib/actions"
import PostList from "@/components/post-list"
import Pagination from "@/components/pagination"
import AdminHeader from "@/components/admin-header"

interface AdminPageProps {
  searchParams: { page?: string }
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // 관리자 권한 확인
  const isAdmin = await getAdminStatus()

  if (!isAdmin) {
    redirect("/")
  }

  // 페이지 번호 가져오기
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1

  // 게시물 목록 가져오기
  const { data: posts, totalPages, currentPage } = await getPosts(page)

  return (
    <main>
      <AdminHeader />

      <PostList posts={posts} />

      <Pagination totalPages={totalPages} currentPage={currentPage} />
    </main>
  )
}
