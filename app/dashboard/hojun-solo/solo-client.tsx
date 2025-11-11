"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { HeartCrack } from "lucide-react";
import lottie, { type AnimationItem } from "lottie-web";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { HojunSoloWish } from "@/lib/hojun-solo";
import brokenHeartAnimation from "../../../public/broken-heart.json" assert { type: "json" };

type HojunSoloClientProps = {
  initialWishes: HojunSoloWish[];
};

const MAX_LENGTH = 160;

function computePosition(id: number) {
  const seed = Math.abs(id * 2654435761) % 10000;
  const top = 8 + ((seed % 8200) / 100);
  const left = 5 + (((seed * 37) % 9000) / 100);
  const rotation = -12 + ((seed * 17) % 2400) / 100;

  return {
    top: `${Math.min(92, top)}%`,
    left: `${Math.min(92, left)}%`,
    rotate: rotation,
  };
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function HojunSoloClient({ initialWishes }: HojunSoloClientProps) {
  const [wishes, setWishes] = useState(initialWishes);
  const [message, setMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const animationContainerRef = useRef<HTMLDivElement | null>(null);
  const animationInstanceRef = useRef<AnimationItem | null>(null);

  const charactersLeft = MAX_LENGTH - message.length;
  const isSubmitDisabled =
    !message.trim() || charactersLeft < 0 || isPending || isAnimating;

  const positions = useMemo(() => {
    return wishes.map((wish) => ({
      wish,
      position: computePosition(wish.id),
    }));
  }, [wishes]);

  const triggerHeartAnimation = useCallback(() => {
    setIsAnimating(true);

    return () => {
      setIsAnimating(false);
    };
  }, []);

  useEffect(() => {
    if (!isAnimating) {
      animationInstanceRef.current?.destroy();
      animationInstanceRef.current = null;
      return;
    }

    if (!animationContainerRef.current) {
      return;
    }

    animationInstanceRef.current?.destroy();

    const animation = lottie.loadAnimation({
      container: animationContainerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: brokenHeartAnimation,
    });

    animationInstanceRef.current = animation;

    const handleComplete = () => {
      setIsAnimating(false);
    };

    animation.addEventListener("complete", handleComplete);

    return () => {
      animation.removeEventListener("complete", handleComplete);
      animation.destroy();
      animationInstanceRef.current = null;
    };
  }, [isAnimating]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitDisabled) {
        return;
      }

      const cancelAnimation = triggerHeartAnimation();

      startTransition(async () => {
        try {
          const response = await fetch("/api/hojun-solo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
          });

          const data = (await response.json()) as {
            success: boolean;
            data?: HojunSoloWish;
            error?: string;
          };

          if (!response.ok || !data.success || !data.data) {
            throw new Error(data.error || "저장에 실패했습니다.");
          }

          setWishes((prev) => [data.data!, ...prev].slice(0, 200));
          setMessage("");

          toast({
            title: "기원 완료!",
            description: "이호준 솔로기원 마음이 성공적으로 전송되었습니다.",
          });
        } catch (error) {
          console.error(error);
          toast({
            title: "저장 실패",
            description:
              error instanceof Error
                ? error.message
                : "기원 메시지를 저장하는 중 문제가 발생했습니다.",
            variant: "destructive",
          });
          cancelAnimation();
        }
      });
    },
    [isSubmitDisabled, message, startTransition, toast, triggerHeartAnimation]
  );

  return (
    <>
      <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-background p-4 sm:p-6 md:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {positions.map(({ wish, position }) => (
            <span
              key={wish.id}
              className="absolute max-w-[40vw] text-xs font-semibold uppercase tracking-widest text-rose-400 opacity-40 mix-blend-multiply transition hover:opacity-70 md:text-sm lg:text-base"
              style={{
                top: position.top,
                left: position.left,
                transform: `rotate(${position.rotate}deg)`,
              }}
            >
              {wish.message}
            </span>
          ))}
        </div>

        {isAnimating && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="heart-break" aria-hidden="true">
              <div
                ref={animationContainerRef}
                className="heart-player"
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6">
          <Card className="border-0 bg-secondary shadow-xl backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500 shadow-inner">
                <HeartCrack />
              </div>
              <CardTitle className="text-2xl font-bold sm:text-3xl">
                이호준 솔로기원 운동
              </CardTitle>
              <p className="text-sm text-muted-foreground sm:text-base">
                열렬한 기원 한 문장을 남기고, 다 같이 이호준의 솔로 라이프를 응원해요.
              </p>
              <p className="text-sm text-muted-foreground sm:text-base">
                현재 참여자 수:
                {wishes.length}
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="wish-message"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    기원 한 문장
                  </label>
                  <Textarea
                    id="wish-message"
                    placeholder="예: 이호준, 올해도 솔로로 지내게 해주세요!"
                    value={message}
                    maxLength={MAX_LENGTH + 10}
                    onChange={(event) => setMessage(event.target.value)}
                    className="min-h-[120px] resize-none border-rose-200 bg-background focus-visible:ring-rose-400 text-foreground"
                  />
                  <div
                    className={cn(
                      "flex items-center justify-end text-xs font-medium",
                      charactersLeft < 0
                        ? "text-rose-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {charactersLeft < 0
                      ? `글자 수가 ${Math.abs(charactersLeft)}자 초과했습니다.`
                      : `남은 글자 수: ${charactersLeft}자`}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-base font-semibold text-white shadow-lg transition hover:shadow-rose-200 focus-visible:ring-rose-400 sm:text-lg"
                  disabled={isSubmitDisabled}
                >
                  <HeartCrack className="h-4 w-4 sm:h-5 sm:w-5" />
                  기원 전송하기
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 bg-secondary backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-semibold sm:text-xl">
                최근 기원 모음
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {wishes.slice(0, 6).map((wish) => (
                <div
                  key={wish.id}
                  className="rounded-2xl border border-rose-100 bg-background/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <p className="text-sm leading-relaxed text-foreground">
                    {wish.message}
                  </p>
                  <p className="mt-3 text-right text-xs text-rose-400">
                    {formatDate(wish.created_at)}
                  </p>
                </div>
              ))}
              {wishes.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-background/60 p-6 text-center text-sm text-muted-foreground">
                  아직 기원이 없습니다. 첫 기원의 주인공이 되어주세요!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <style jsx>{`
          .heart-break {
            position: relative;
            width: 220px;
            height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .heart-player :global(svg) {
            width: 100% !important;
            height: 100% !important;
          }
        `}</style>
      </div>
    </>
  );
}
