"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { v4 as uuidv4 } from "uuid";
export default function PostForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = uuidv4(); // 새 UUID 생성
      localStorage.setItem("userId", storedUserId); // 로컬 스토리지에 저장
    }
    setUserId(storedUserId);
  }, []);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return; // userId가 준비되지 않았다면 중단
    setIsSubmitting(true);

    const result = await createPost({ title, content, userId }); // userId 추가
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "게시물이 등록되었습니다.",
        description: "익명으로 게시물이 등록되었습니다.",
      });

      // 폼 초기화
      setTitle("");
      setContent("");
    } else {
      toast({
        title: "오류가 발생했습니다.",
        description:
          result.error || "게시물을 등록하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }

    router.refresh();
  }

  function handleReset() {
    setTitle("");
    setContent("");
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              name="title"
              placeholder="게시물 제목을 입력하세요"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="게시물 내용을 입력하세요"
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            초기화
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                게시 중...
              </>
            ) : (
              "게시하기"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
