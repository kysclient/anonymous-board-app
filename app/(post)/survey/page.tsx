import LoadingSpinner from "@/components/loading-spinner";
import { SurveyForm } from "@/components/survey-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <main className="space-y-8">
      <Suspense fallback={<LoadingSpinner message="로딩 중..." />}>
        <SurveyForm />
      </Suspense>
    </main>
  );
}
