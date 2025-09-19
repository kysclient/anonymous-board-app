"use client";

import type React from "react";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useUsers } from "./users-context";
import { createUser } from "../actions";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    join_date: "",
    last_meetup_date: "",
    is_regular: "신입" as "신입" | "기존",
    meetup_count: 0,
    total_meetup_count: 0,
  });
  const { refreshUsers } = useUsers();
  const { toast } = useToast();

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
      const result = await createUser({
        ...formData,
        meetup_count: Number(formData.meetup_count),
        total_meetup_count: Number(formData.total_meetup_count),
      });

      if (result.success) {
        toast({
          title: "사용자 생성 성공",
          description: "새로운 사용자가 추가되었습니다.",
        });
        setOpen(false);
        setFormData({
          name: "",
          join_date: "",
          last_meetup_date: "",
          is_regular: "신입",
          meetup_count: 0,
          total_meetup_count: 0,
        });
        // 데이터 업데이트 후 목록 새로고침
        await refreshUsers();
        window.location.reload();
      } else {
        toast({
          title: "사용자 생성 실패",
          description: result.error || "오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "사용자 생성 실패",
        description: "오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">멤버 추가</span>
          <span className="sm:hidden">추가</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-4 max-w-md sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 멤버 추가</DialogTitle>
            <DialogDescription>
              새로운 멤버 정보를 입력하세요. 모든 필드를 작성한 후 저장 버튼을
              클릭하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="join_date">가입일</Label>
              <Input
                id="join_date"
                name="join_date"
                type="date"
                value={formData.join_date}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_meetup_date">최근 벙 참석일</Label>
              <Input
                id="last_meetup_date"
                name="last_meetup_date"
                type="date"
                value={formData.last_meetup_date}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_regular">구분</Label>
              <Select
                value={formData.is_regular}
                onValueChange={(value) =>
                  handleSelectChange("is_regular", value)
                }
              >
                <SelectTrigger id="is_regular">
                  <SelectValue placeholder="구분 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="신입">신입</SelectItem>
                  <SelectItem value="기존">기존</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="meetup_count">이번 달 벙 참여</Label>
                <Input
                  id="meetup_count"
                  name="meetup_count"
                  type="number"
                  min="0"
                  value={formData.meetup_count}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_meetup_count">누적 벙 참여</Label>
                <Input
                  id="total_meetup_count"
                  name="total_meetup_count"
                  type="number"
                  min="0"
                  value={formData.total_meetup_count}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
