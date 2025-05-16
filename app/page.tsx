import PostForm from "@/components/post-form"
import AdminForm from "@/components/admin-form"
import { getAdminStatus } from "@/lib/actions"

export default async function Home() {
  const isAdmin = await getAdminStatus()

  return (
    <main className="space-y-8">
      <PostForm />

      {!isAdmin && (
        <div className="border-t pt-8">
          <AdminForm />
        </div>
      )}
    </main>
  )
}
