"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { increementMeetupMakeCount } from "../actions";

interface IncrementMakeButtonProps {
  userId: number;
  onSuccess: () => Promise<void>;
}

export function IncreementMakeButton({
  userId,
  onSuccess,
}: IncrementMakeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleIncrement = async () => {
    setIsLoading(true);

    try {
      const result = await increementMeetupMakeCount(userId);

      if (result.success) {
        toast({
          title: "벙주 횟수 추가 성공",
          description: "벙주 횟수가 증가되었습니다.",
        });
        await onSuccess();
      } else {
        toast({
          title: "벙주 횟수 추가 실패",
          description: result.error || "오류가 발생했습니다.",
        });
      }
    } catch (error) {
      toast({
        title: "벙주 횟수 추가 실패",
        description: "오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleIncrement}
      disabled={isLoading}
      title="벙주 횟수 추가"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-md-tertiary-container text-md-on-tertiary-container transition-all hover:elev-1 active:scale-90 disabled:opacity-50"
    >
      <Plus className="h-4 w-4" />
      <span className="sr-only">벙주 횟수 추가</span>
    </button>
  );
}
