"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "next/navigation";

export function ResetMeetupCountsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { refreshUsers } = useUsers();
  const { toast } = useToast();
  const router = useRouter();

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
        // 데이터 업데이트 후 목록 새로고침
        // await refreshUsers();
        window.location.reload();
        // router.replace("/dashboard/users");
      } else {
        toast({
          title: "벙 참여 횟수 초기화 실패",
          description: result.error || "오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "벙 참여 횟수 초기화 실패",
        description: "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">월별 초기화</span>
          <span className="sm:hidden">초기화</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="mx-4 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>월별 벙 참여 횟수 초기화</AlertDialogTitle>
          <AlertDialogDescription>
            모든 사용자의 이번 달 벙 참여 횟수를 0으로 초기화합니다. 이 작업은
            되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isLoading} className="w-full sm:w-auto">
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "초기화 중..." : "초기화"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
