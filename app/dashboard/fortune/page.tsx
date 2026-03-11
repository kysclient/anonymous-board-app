"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const FORTUNE_TYPES = [
  {
    value: "saju",
    label: "사주팔자",
    desc: "사주 천간지지 기반 운세 풀이",
  },
  {
    value: "tarot",
    label: "타로 리딩",
    desc: "3장 카드로 보는 과거/현재/미래",
  },
  {
    value: "zodiac",
    label: "별자리 운세",
    desc: "서양 점성술 기반 별자리 분석",
  },
  {
    value: "love",
    label: "연애운/궁합",
    desc: "연애 스타일과 이상형 분석",
  },
];

const BIRTH_TIMES = [
  { value: "모름", label: "모름" },
  { value: "자시(23:00~01:00)", label: "자시 (23:00~01:00)" },
  { value: "축시(01:00~03:00)", label: "축시 (01:00~03:00)" },
  { value: "인시(03:00~05:00)", label: "인시 (03:00~05:00)" },
  { value: "묘시(05:00~07:00)", label: "묘시 (05:00~07:00)" },
  { value: "진시(07:00~09:00)", label: "진시 (07:00~09:00)" },
  { value: "사시(09:00~11:00)", label: "사시 (09:00~11:00)" },
  { value: "오시(11:00~13:00)", label: "오시 (11:00~13:00)" },
  { value: "미시(13:00~15:00)", label: "미시 (13:00~15:00)" },
  { value: "신시(15:00~17:00)", label: "신시 (15:00~17:00)" },
  { value: "유시(17:00~19:00)", label: "유시 (17:00~19:00)" },
  { value: "술시(19:00~21:00)", label: "술시 (19:00~21:00)" },
  { value: "해시(21:00~23:00)", label: "해시 (21:00~23:00)" },
];

export default function FortunePage() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("모름");
  const [gender, setGender] = useState("");
  const [fortuneType, setFortuneType] = useState("");
  const [result, setResult] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const selectedType = FORTUNE_TYPES.find((t) => t.value === fortuneType);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !birthDate || !fortuneType) {
      setError("이름, 생년월일, 운세 종류는 필수입니다.");
      return;
    }

    setError("");
    setResult("");
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          birthDate,
          birthTime,
          gender,
          fortuneType,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "오류가 발생했습니다.");
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        // 마지막 조각은 불완전할 수 있으므로 버퍼에 유지
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setResult((prev) => prev + parsed.content);
              if (resultRef.current) {
                resultRef.current.scrollTop = resultRef.current.scrollHeight;
              }
            }
          } catch {
            // skip incomplete JSON
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError("응답 중 오류가 발생했습니다.");
      }
    } finally {
      setIsStreaming(false);
    }
  }, [name, birthDate, birthTime, gender, fortuneType]);

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setResult("");
    setError("");
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
          <Sparkles className="h-3 w-3" />
          Fortune
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          운세 / 사주
        </h1>
        <p className="text-xs text-muted-foreground">
          정보를 입력하고 AI가 풀어주는 고품격 운세를 확인하세요
        </p>
      </div>

      {/* Fortune type selection */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FORTUNE_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setFortuneType(type.value)}
            disabled={isStreaming}
            className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
              fortuneType === type.value
                ? "border-transparent ring-2 ring-offset-2 ring-offset-background bg-blue-500/10 ring-blue-500 text-blue-600 dark:text-blue-400"
                : "border-border/60 hover:border-border hover:shadow-sm"
            }`}
          >
            <div className="relative">
              <p
                className={`text-[13px] font-semibold ${
                  fortuneType === type.value ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                }`}
              >
                {type.label}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {type.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Input form */}
      <div className="rounded-xl border border-border/60 bg-card/80 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[12px]">
              이름 *
            </Label>
            <Input
              id="name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isStreaming}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate" className="text-[12px]">
              생년월일 *
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={isStreaming}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[12px]">태어난 시간</Label>
            <Select value={birthTime} onValueChange={setBirthTime} disabled={isStreaming}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BIRTH_TIMES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[12px]">성별</Label>
            <Select value={gender} onValueChange={setGender} disabled={isStreaming}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="남">남</SelectItem>
                <SelectItem value="여">여</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-[12px] font-medium text-red-500">{error}</p>
        )}

        <div className="mt-5 flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isStreaming || !fortuneType}
            className="h-10 flex-1 font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            {isStreaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                운세 보는 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                운세 보기
              </>
            )}
          </Button>
          {result && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-10 w-10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Result area */}
      {(result || isStreaming) && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/80">
          <div className="flex items-center gap-2 border-b bg-blue-500/10 px-5 py-3">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">
              {selectedType?.label} 결과
            </span>
            {isStreaming && (
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                </span>
                응답 중
              </span>
            )}
          </div>
          <div
            ref={resultRef}
            className="max-h-[600px] overflow-y-auto p-5"
          >
            <div className="fortune-markdown text-[13px] leading-relaxed text-foreground/90">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              {isStreaming && result && (
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-current align-middle" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
