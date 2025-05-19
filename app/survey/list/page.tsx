import LoadingSpinner from "@/components/loading-spinner";
import { SurveyList } from "@/components/survey-list";
import { getAdminStatus } from "@/lib/actions";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Page() {
  const isAdmin = await getAdminStatus();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <main>
      <Suspense fallback={<LoadingSpinner message="게시물을 불러오는 중..." />}>
        <SurveyList />
      </Suspense>
    </main>
  );
}
