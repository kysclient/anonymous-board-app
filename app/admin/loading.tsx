import LoadingSpinner from "@/components/loading-spinner";

export default function Loading() {
  return (
    <div className="mt-8">
      <LoadingSpinner message="게시물을 불러오는 중..." />
    </div>
  );
}
