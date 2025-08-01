"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateUser, User } from "../\bactions";

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    join_date: user.join_date || "",
    last_meetup_date: user.last_meetup_date || "",
    is_regular: user.is_regular as "신입" | "기존",
    meetup_count: user.meetup_count,
    total_meetup_count: user.total_meetup_count,
    meetup_make_count: user.meetup_make_count,

  });
  const { toast } = useToast();

  // 사용자 데이터가 변경될 때 폼 데이터 업데이트
  useEffect(() => {
    setFormData({
      name: user.name,
      join_date: user.join_date || "",
      last_meetup_date: user.last_meetup_date || "",
      is_regular: user.is_regular as "신입" | "기존",
      meetup_count: user.meetup_count,
      total_meetup_count: user.total_meetup_count,
      meetup_make_count: user.meetup_make_count,

    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateUser(user.id, {
        ...formData,
        meetup_count: Number(formData.meetup_count),
        total_meetup_count: Number(formData.total_meetup_count),
        meetup_make_count: Number(formData.meetup_make_count),
      });

      if (result.success) {
        toast({
          title: "사용자 업데이트 성공",
          description: "사용자 정보가 업데이트되었습니다.",
        });
        onOpenChange(false);
        // 데이터 업데이트 후 목록 새로고침
        await onSuccess();
      } else {
        toast({
          title: "사용자 업데이트 실패",
          description: result.error || "오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "사용자 업데이트 실패",
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>사용자 정보 편집</DialogTitle>
            <DialogDescription>
              사용자 정보를 수정하세요. 모든 필드를 작성한 후 저장 버튼을
              클릭하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                이름
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-join_date" className="text-right">
                가입일
              </Label>
              <Input
                id="edit-join_date"
                name="join_date"
                type="date"
                value={formData.join_date}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-last_meetup_date" className="text-right">
                최근 벙 참석일
              </Label>
              <Input
                id="edit-last_meetup_date"
                name="last_meetup_date"
                type="date"
                value={formData.last_meetup_date}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_regular" className="text-right">
                구분
              </Label>
              <Select
                value={formData.is_regular}
                onValueChange={(value) =>
                  handleSelectChange("is_regular", value)
                }
              >
                <SelectTrigger id="edit-is_regular" className="col-span-3">
                  <SelectValue placeholder="구분 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="신입">신입</SelectItem>
                  <SelectItem value="기존">기존</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-meetup_count" className="text-right">
                이번 달 벙 참여
              </Label>
              <Input
                id="edit-meetup_count"
                name="meetup_count"
                type="number"
                min="0"
                value={formData.meetup_count}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
                    <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-meetup_count" className="text-right">
                이번 달 벙주 횟수
              </Label>
              <Input
                id="edit-meetup_make_count"
                name="meetup_make_count"
                type="number"
                min="0"
                value={formData.meetup_make_count}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-total_meetup_count" className="text-right">
                누적 벙 참여
              </Label>
              <Input
                id="edit-total_meetup_count"
                name="total_meetup_count"
                type="number"
                min="0"
                value={formData.total_meetup_count}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
