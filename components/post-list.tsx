"use client";

import { useRef, useState } from "react";
import type { Post } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Camera } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import html2canvas from "html2canvas";

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  const [capturingId, setCapturingId] = useState<number | null>(null);
  const postRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // 게시물 캡처 함수
  const capturePost = async (postId: number) => {
    setCapturingId(postId);

    try {
      const postElement = postRefs.current[postId];

      if (!postElement) {
        throw new Error("게시물 요소를 찾을 수 없습니다.");
      }

      const timeElement = postElement.querySelector(
        "[data-time]"
      ) as HTMLElement;

      // IP 요소 찾기
      const ipElement = postElement.querySelector("[data-ip]") as HTMLElement;
      // 버튼 요소 찾기
      const buttonElement = postElement.querySelector(
        "[data-button]"
      ) as HTMLElement;

      // 원래 상태 저장
      const originalTimeText = timeElement?.innerText;
      const originalIpText = ipElement?.innerText;
      const originalButtonDisplay = buttonElement?.style.display;

      if (timeElement) {
        timeElement.innerText = "";
      }
      // IP 가리기
      if (ipElement) {
        ipElement.innerText = "";
      }

      // 버튼 숨기기
      if (buttonElement) {
        buttonElement.style.display = "none";
      }

      // 캡처 실행
      const canvas = await html2canvas(postElement, {
        backgroundColor: "#ffffff",
        scale: 2, // 고해상도 캡처
        logging: false,
      });

      // IP 텍스트 복원
      if (timeElement && originalTimeText) {
        timeElement.innerText = originalTimeText;
      }

      // IP 텍스트 복원
      if (ipElement && originalIpText) {
        ipElement.innerText = originalIpText;
      }

      // 버튼 표시 복원
      if (buttonElement && originalButtonDisplay) {
        buttonElement.style.display = originalButtonDisplay;
      } else if (buttonElement) {
        buttonElement.style.display = "flex"; // 기본값 복원
      }

      // 캡처 이미지 다운로드
      const link = document.createElement("a");
      link.download = `게시물_${postId}_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("캡처 중 오류 발생:", error);
      alert("게시물 캡처 중 오류가 발생했습니다.");
    } finally {
      setCapturingId(null);
    }
  };

  // ref 콜백 함수 - 값을 반환하지 않도록 수정
  const setPostRef = (el: HTMLDivElement | null, postId: number) => {
    postRefs.current[postId] = el;
  };

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>게시물이 없습니다.</p>
        </div>
      ) : (
        posts.map((post) => (
          <Card
            key={post.id}
            ref={(el) => setPostRef(el, post.id)}
            className="relative"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start">
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div data-time>{formatDate(new Date(post.created_at))}</div>
                  <div className="sm:text-right" data-ip>
                    IP: {post.ip}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{post.content}</p>
            </CardContent>
            <CardFooter className="flex justify-end pt-2">
              <Button
                data-button
                variant="outline"
                size="sm"
                onClick={() => capturePost(post.id)}
                disabled={capturingId === post.id}
              >
                {capturingId === post.id ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    캡처 중...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    캡처
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
}
