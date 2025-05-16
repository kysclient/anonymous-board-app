import PostForm from "@/components/post-form";
import AdminForm from "@/components/admin-form";
import { getAdminStatus } from "@/lib/actions";
import { Suspense } from "react";
import LoadingSpinner from "@/components/loading-spinner";

export default async function Home() {
  const isAdmin = await getAdminStatus();

  return (
    <main className="space-y-8">
      <Suspense fallback={<LoadingSpinner message="로딩 중..." />}>
        <PostForm />

        {!isAdmin && (
          <div className="border-t pt-8">
            <AdminForm />
          </div>
        )}
      </Suspense>
    </main>
  );
}
