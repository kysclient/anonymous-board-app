"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "./users-context";
import { deleteUser } from "../actions";

interface DeleteUserDialogProps {
  userId: number;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function DeleteUserDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onSuccess,
}: DeleteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUsers } = useUsers();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const result = await deleteUser(userId);

      if (result.success) {
        toast({
          title: "사용자 삭제 성공",
          description: "사용자가 삭제되었습니다.",
        });
        onOpenChange(false);
        // 데이터 업데이트 후 목록 새로고침
        await onSuccess();
      } else {
        toast({
          title: "사용자 삭제 실패",
          description: result.error || "오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "사용자 삭제 실패",
        description: "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>사용자 삭제</DialogTitle>
          <DialogDescription>
            정말로 {userName} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수
            없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
