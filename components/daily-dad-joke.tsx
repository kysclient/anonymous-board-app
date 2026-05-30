"use client";

import { useState } from "react";
import { Laugh, Eye, EyeOff, Sparkles } from "lucide-react";

interface DadJoke {
  q: string;
  a: string;
}

const JOKES: DadJoke[] = [
  { q: "세상에서 가장 뜨거운 과일은?", a: "천도복숭아 (천 도!)" },
  { q: "추장보다 높은 사람은?", a: "고추장" },
  { q: "도둑이 가장 싫어하는 아이스크림은?", a: "누가바 (누가 봐!)" },
  { q: "바나나가 웃으면?", a: "바나나킥" },
  { q: "세상에서 가장 빠른 닭은?", a: "후다닭" },
  { q: "미국에 비가 내리면?", a: "USB (유에스비)" },
  { q: "오리를 생으로 먹으면?", a: "회오리" },
  { q: "김밥이 죽으면?", a: "김밥천국" },
  { q: "세종대왕이 만든 우유는?", a: "아야어여오요우유" },
  { q: "화장실에서 방금 나온 사람의 국적은?", a: "일본 (일 본 사람)" },
  { q: "소금이 죽으면?", a: "죽염" },
  { q: "개가 사람을 가르치면?", a: "개인교습" },
  { q: "햄버거의 색깔은?", a: "버건디" },
  { q: "딸기가 회사에서 잘리면?", a: "딸기시럽 (실업…)" },
  { q: "가장 추운 곳에 사는 동물은?", a: "추워하마" },
];

export default function DailyDadJoke() {
  // 날짜 기준으로 하루에 하나씩 (서버/클라이언트 동일한 day 인덱스 → 하이드레이션 안전)
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const joke = JOKES[dayIndex % JOKES.length];
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-4">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
        <Laugh className="h-3 w-3" />
        오늘의 질문
      </span>

      <p className="text-shimmer type-display-small text-balance max-w-3xl font-extrabold leading-snug tracking-tight sm:type-display-medium">
        {joke.q}
      </p>

      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 type-label-large font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {show ? "정답 숨기기" : "정답 보기"}
      </button>

      {show && (
        <div className="animate-m3-fade-in max-w-2xl rounded-2xl border border-white/25 bg-white/15 px-5 py-4 text-white backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-200" />
            <span className="type-label-medium uppercase tracking-wider text-white/70">
              정답
            </span>
          </div>
          <p className="mt-1.5 type-headline-small font-bold">{joke.a}</p>
        </div>
      )}
    </div>
  );
}
