import { Spinner } from "@/components/ui/spinner";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "로딩 중...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" className="text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
