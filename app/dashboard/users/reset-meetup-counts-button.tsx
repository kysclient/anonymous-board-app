"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "./users-context";
import { resetAllMeetupCounts } from "../actions";

export function ResetMeetupCountsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { refreshUsers } = useUsers();
  const { toast } = useToast();

  const handleReset = async () => {
    setIsLoading(true);

    try {
      const result = await resetAllMeetupCounts();

      if (result.success) {
        toast({
          title: "벙 참여 횟수 초기화 성공",
          description: "모든 사용자의 이번 달 벙 참여 횟수가 초기화되었습니다.",
        });
        setOpen(false);
        await refreshUsers();
      } else {
        toast({
          title: "벙 참여 횟수 초기화 실패",
          description: result.error || "오류가 발생했습니다.",
        });
      }
    } catch (error) {
      toast({
        title: "벙 참여 횟수 초기화 실패",
        description: "오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className="m3-btn m3-btn-outlined">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">월별 초기화</span>
          <span className="sm:hidden">초기화</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="mx-4 max-w-md rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>월별 벙 참여 횟수 초기화</AlertDialogTitle>
          <AlertDialogDescription>
            모든 사용자의 이번 달 벙 참여 횟수를 0으로 초기화합니다. 이 작업은
            되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel disabled={isLoading} className="w-full sm:w-auto rounded-full">
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-full"
          >
            {isLoading ? "초기화 중..." : "초기화"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
