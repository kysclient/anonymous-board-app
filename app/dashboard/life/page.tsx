"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Calendar,
  ArrowRight,
  RotateCcw,
  Footprints,
  UtensilsCrossed,
  Smile,
  Cloud,
  Eye,
  Scissors,
  Smartphone,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EXPECTED_LIFESPAN = 80;
const WEEKS_PER_YEAR = 52;
const TOTAL_WEEKS = EXPECTED_LIFESPAN * WEEKS_PER_YEAR;

function getWeeksBetween(start: Date, end: Date): number {
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor((end.getTime() - start.getTime()) / msPerWeek);
}

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

// 띠 계산
function getZodiacAnimal(year: number): string {
  const animals = [
    "원숭이", "닭", "개", "돼지", "쥐", "소",
    "호랑이", "토끼", "용", "뱀", "말", "양",
  ];
  return animals[year % 12];
}

// 별자리 계산
function getZodiacSign(month: number, day: number): string {
  const signs = [
    { sign: "염소자리", startMonth: 1, startDay: 1, endMonth: 1, endDay: 19 },
    { sign: "물병자리", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    { sign: "물고기자리", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
    { sign: "양자리", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    { sign: "황소자리", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    { sign: "쌍둥이자리", startMonth: 5, startDay: 21, endMonth: 6, endDay: 21 },
    { sign: "게자리", startMonth: 6, startDay: 22, endMonth: 7, endDay: 22 },
    { sign: "사자자리", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    { sign: "처녀자리", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
    { sign: "천칭자리", startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
    { sign: "전갈자리", startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
    { sign: "궁수자리", startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
    { sign: "염소자리", startMonth: 12, startDay: 22, endMonth: 12, endDay: 31 },
  ];
  for (const s of signs) {
    if (
      (month === s.startMonth && day >= s.startDay) ||
      (month === s.endMonth && day <= s.endDay)
    ) {
      return s.sign;
    }
  }
  return "염소자리";
}

function getBirthDayOfWeek(date: Date): string {
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  return days[date.getDay()];
}

function getDaysUntilNextBirthday(birthDate: Date): number {
  const now = new Date();
  const nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBirthday.getTime() < now.getTime()) {
    nextBirthday.setFullYear(now.getFullYear() + 1);
  }
  return Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getGeneration(year: number): string {
  if (year >= 2013) return "알파 세대";
  if (year >= 1997) return "Z세대";
  if (year >= 1981) return "밀레니얼 세대";
  if (year >= 1965) return "X세대";
  if (year >= 1946) return "베이비붐 세대";
  return "침묵의 세대";
}

function getFamousBirthYear(year: number): string | null {
  const famous: Record<number, string> = {
    1990: "손흥민, 아이유",
    1991: "에드 시런",
    1992: "셀레나 고메즈",
    1993: "아리아나 그란데",
    1994: "저스틴 비버, 해리 스타일스",
    1995: "도이치, 차은우",
    1996: "톰 홀랜드, 제니",
    1997: "카밀라 카베요",
    1998: "빌리 아일리시, 장원영",
    1999: "안유진",
    2000: "올리비아 로드리고",
    2001: "빈지노, 카리나",
    2002: "장원영",
    2003: "뉴진스 혜인",
    1985: "이민호",
    1986: "레이디 가가, 드레이크",
    1987: "리오넬 메시",
    1988: "아델, 리한나",
    1989: "테일러 스위프트, 손예진",
    1980: "김연아(감독)",
    1982: "이승기",
    1983: "공유",
    1984: "마크 저커버그",
  };
  return famous[year] || null;
}

function getFunComparisons(daysLived: number, hoursLived: number) {
  const comparisons = [];

  const kmWalked = Math.round(daysLived * 6.5);
  comparisons.push({
    label: "걸어온 거리",
    value: `약 ${formatNumber(kmWalked)}km`,
    detail:
      kmWalked > 384400
        ? `달까지 갔다올 수 있는 거리 (${(kmWalked / 384400).toFixed(1)}회)`
        : `지구 ${(kmWalked / 40075).toFixed(1)}바퀴`,
  });

  const meals = daysLived * 3;
  comparisons.push({
    label: "먹은 끼니 수",
    value: `약 ${formatNumber(meals)}끼`,
    detail: `밥그릇 ${formatNumber(meals)}개를 비웠습니다`,
  });

  const laughs = daysLived * 15;
  comparisons.push({
    label: "웃은 횟수",
    value: `약 ${formatNumber(laughs)}번`,
    detail: "평균 하루 15번 웃는다고 합니다",
  });

  const dreams = daysLived * 5;
  comparisons.push({
    label: "꿈꾼 횟수",
    value: `약 ${formatNumber(dreams)}번`,
    detail: "매일 밤 평균 4~6개의 꿈을 꿉니다",
  });

  const blinks = hoursLived * 900;
  comparisons.push({
    label: "눈 깜빡임",
    value: `약 ${formatNumber(Math.round(blinks / 1000000))}M번`,
    detail: "1시간에 약 900번 깜빡입니다",
  });

  const hairCm = Math.round(daysLived * 0.035 * 10) / 10;
  comparisons.push({
    label: "머리카락 총 성장",
    value: `약 ${(hairCm / 100).toFixed(1)}m`,
    detail: "하루에 약 0.35mm씩 자랍니다",
  });

  const phoneChecks = daysLived > 3650 ? (daysLived - 3650) * 96 : 0;
  if (phoneChecks > 0) {
    comparisons.push({
      label: "스마트폰 확인 (추정)",
      value: `약 ${formatNumber(phoneChecks)}번`,
      detail: "하루 평균 96번 스마트폰을 봅니다",
    });
  }

  const waterLiters = Math.round(daysLived * 2);
  comparisons.push({
    label: "마신 물",
    value: `약 ${formatNumber(waterLiters)}L`,
    detail: `${(waterLiters / 2500).toFixed(1)}개의 욕조를 채울 수 있는 양`,
  });

  return comparisons;
}

function getMilestones(birthDate: Date) {
  const milestones: { label: string; date: Date; isPast: boolean }[] = [];

  const add = (label: string, date: Date) => {
    milestones.push({ label, date, isPast: date.getTime() <= Date.now() });
  };

  add("1,000일", new Date(birthDate.getTime() + 1000 * 86400000));
  add("10,000일", new Date(birthDate.getTime() + 10000 * 86400000));
  add("20,000일", new Date(birthDate.getTime() + 20000 * 86400000));
  add("1억 초", new Date(birthDate.getTime() + 100000000 * 1000));
  add("10억 초", new Date(birthDate.getTime() + 1000000000 * 1000));
  add("30,000일", new Date(birthDate.getTime() + 30000 * 86400000));

  return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface Stats {
  weeksLived: number;
  weeksRemaining: number;
  daysLived: number;
  hoursLived: number;
  heartbeats: number;
  breaths: number;
  sunrises: number;
  sleepYears: number;
  percentLived: number;
  seasons: number;
  fullMoons: number;
}

function calculateStats(birthDate: Date): Stats {
  const now = new Date();
  const msLived = now.getTime() - birthDate.getTime();
  const daysLived = Math.floor(msLived / (1000 * 60 * 60 * 24));
  const weeksLived = getWeeksBetween(birthDate, now);
  const hoursLived = Math.floor(msLived / (1000 * 60 * 60));

  return {
    weeksLived,
    weeksRemaining: Math.max(0, TOTAL_WEEKS - weeksLived),
    daysLived,
    hoursLived,
    heartbeats: daysLived * 100000,
    breaths: daysLived * 23000,
    sunrises: daysLived,
    sleepYears: Math.round((daysLived / 365) * 100 * (1 / 3)) / 100,
    percentLived: Math.min(100, Math.round((weeksLived / TOTAL_WEEKS) * 10000) / 100),
    seasons: Math.floor(daysLived / 91),
    fullMoons: Math.floor(daysLived / 29.5),
  };
}

function LiveCounter({ birthDate }: { birthDate: Date }) {
  const [seconds, setSeconds] = useState(
    Math.floor((Date.now() - birthDate.getTime()) / 1000)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - birthDate.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [birthDate]);

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 text-center space-y-1.5">
      <p className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 tracking-wide uppercase">
        살아온 시간 (초)
      </p>
      <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight font-mono">
        {formatNumber(seconds)}
      </p>
      <p className="text-[10px] text-muted-foreground">지금 이 순간에도 흐르고 있습니다</p>
    </div>
  );
}

function WeekGrid({ weeksLived }: { weeksLived: number }) {
  const years = Array.from({ length: EXPECTED_LIFESPAN }, (_, i) => i);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[340px]">
        <div className="flex items-end mb-1.5 pl-8">
          {[0, 10, 20, 30, 40, 51].map((w) => (
            <span
              key={w}
              className="text-[8px] sm:text-[9px] text-muted-foreground/60 tabular-nums"
              style={{
                position: "relative",
                left: `${(w / 52) * 100}%`,
                width: 0,
                whiteSpace: "nowrap",
              }}
            >
              {w}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-[1.5px] sm:gap-[2px]">
          {years.map((year) => {
            const yearStart = year * WEEKS_PER_YEAR;
            return (
              <div key={year} className="flex items-center gap-0">
                <div className="w-8 flex-shrink-0 text-right pr-2">
                  {year % 10 === 0 && (
                    <span className="text-[8px] sm:text-[9px] text-muted-foreground/60 tabular-nums">
                      {year}
                    </span>
                  )}
                </div>
                <div className="flex gap-[1px] sm:gap-[1.5px] flex-1">
                  {Array.from({ length: WEEKS_PER_YEAR }, (_, week) => {
                    const weekIndex = yearStart + week;
                    const isLived = weekIndex < weeksLived;
                    const isCurrent = weekIndex === weeksLived;
                    return (
                      <div
                        key={week}
                        className={cn(
                          "aspect-square rounded-[1px] sm:rounded-[1.5px] transition-colors flex-1 max-w-[6px] sm:max-w-[8px]",
                          isCurrent
                            ? "bg-blue-500 ring-1 ring-blue-400 ring-offset-1 ring-offset-background"
                            : isLived
                              ? "bg-foreground/70 dark:bg-foreground/60"
                              : "bg-muted-foreground/10 dark:bg-muted-foreground/8"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pl-8">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[1.5px] bg-foreground/70 dark:bg-foreground/60" />
            <span className="text-[10px] text-muted-foreground">살아온 주</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[1.5px] bg-blue-500 ring-1 ring-blue-400" />
            <span className="text-[10px] text-muted-foreground">지금</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[1.5px] bg-muted-foreground/10 dark:bg-muted-foreground/8" />
            <span className="text-[10px] text-muted-foreground">남은 주</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4 sm:p-5 space-y-1">
      <p className="text-[11px] sm:text-xs text-muted-foreground tracking-wide uppercase">
        {label}
      </p>
      <p className="text-lg sm:text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="text-[10px] sm:text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ComparisonCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4 sm:p-5 space-y-1.5">
      <p className="text-[11px] sm:text-xs text-muted-foreground tracking-wide uppercase">
        {label}
      </p>
      <p className="text-base sm:text-lg font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="text-[10px] sm:text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function LifeInWeeksPage() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const parsedDate = useMemo(() => {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    return isNaN(d.getTime()) ? null : d;
  }, [birthDate]);

  const stats = useMemo(() => {
    if (!parsedDate) return null;
    return calculateStats(parsedDate);
  }, [parsedDate]);

  const funData = useMemo(() => {
    if (!parsedDate || !stats) return null;
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();

    return {
      zodiacAnimal: getZodiacAnimal(year),
      zodiacSign: getZodiacSign(month, day),
      birthDay: getBirthDayOfWeek(parsedDate),
      daysUntilBirthday: getDaysUntilNextBirthday(parsedDate),
      generation: getGeneration(year),
      famousSameYear: getFamousBirthYear(year),
      comparisons: getFunComparisons(stats.daysLived, stats.hoursLived),
      milestones: getMilestones(parsedDate),
    };
  }, [parsedDate, stats]);

  const handleSubmit = useCallback(() => {
    if (parsedDate) setSubmitted(true);
  }, [parsedDate]);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setBirthDate("");
  }, []);

  // Step 1: Birth date input
  if (!submitted) {
    return (
      <div className="flex flex-col gap-6 pb-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            <Calendar className="h-3 w-3" />
            Life in weeks
          </div>
          <h1 className="text-xl font-semibold sm:text-2xl">당신의 인생, 주 단위로</h1>
          <p className="text-xs text-muted-foreground">
            인생은 약 4,160주입니다. 지금까지 몇 주를 살았는지 확인해 보세요.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8">
          <div className="space-y-6 w-full max-w-sm">
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                생년월일을 입력해 주세요
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1920-01-01"
                className={cn(
                  "w-full rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
                  "transition-all text-center tabular-nums"
                )}
              />

              <button
                onClick={handleSubmit}
                disabled={!parsedDate}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  parsedDate
                    ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <span>내 인생 확인하기</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center max-w-xs leading-relaxed">
            &ldquo;Less, but better&rdquo; &mdash; Dieter Rams
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Visualization
  if (!stats || !funData || !parsedDate) return null;

  const ageYears = Math.floor(stats.daysLived / 365.25);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            <Calendar className="h-3 w-3" />
            Life in weeks
          </div>
          <h1 className="text-xl font-semibold sm:text-2xl">당신의 인생</h1>
          <p className="text-xs text-muted-foreground">
            {EXPECTED_LIFESPAN}년 기준, {formatNumber(TOTAL_WEEKS)}주 중{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(stats.weeksLived)}주
            </span>
            를 살았습니다
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">다시 하기</span>
        </button>
      </div>

      {/* Identity card */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card/90 to-muted/30 p-5 sm:p-6 space-y-3">
        <div>
          <p className="text-sm font-semibold">
            {parsedDate.getFullYear()}년생 {funData.zodiacAnimal}띠
          </p>
          <p className="text-[11px] text-muted-foreground">
            {funData.zodiacSign} · {funData.birthDay}에 태어남 · {funData.generation}
          </p>
        </div>
        {funData.famousSameYear && (
          <p className="text-[11px] text-muted-foreground">
            같은 해에 태어난 유명인: <span className="text-foreground font-medium">{funData.famousSameYear}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center rounded-full bg-background/80 border px-2.5 py-0.5 text-[10px] font-medium">
            다음 생일까지 {funData.daysUntilBirthday}일
          </span>
          <span className="inline-flex items-center rounded-full bg-background/80 border px-2.5 py-0.5 text-[10px] font-medium">
            만 {ageYears}세
          </span>
          <span className="inline-flex items-center rounded-full bg-background/80 border px-2.5 py-0.5 text-[10px] font-medium">
            {formatNumber(stats.daysLived)}일째 살아가는 중
          </span>
        </div>
      </div>

      {/* Live counter */}
      <LiveCounter birthDate={parsedDate} />

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>탄생</span>
          <span>{stats.percentLived}% 경과</span>
          <span>{EXPECTED_LIFESPAN}세</span>
        </div>
        <div className="h-2 rounded-full bg-muted-foreground/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground/80 transition-all duration-1000 ease-out"
            style={{ width: `${stats.percentLived}%` }}
          />
        </div>
      </div>

      {/* Key stats */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">기본 통계</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="살아온 주"
            value={formatNumber(stats.weeksLived)}
            sub={`${formatNumber(stats.daysLived)}일`}
          />
          <StatCard
            label="남은 주"
            value={formatNumber(stats.weeksRemaining)}
            sub={`약 ${Math.round(stats.weeksRemaining / 52)}년`}
          />
          <StatCard
            label="심장 박동"
            value={`~${formatNumber(Math.round(stats.heartbeats / 1000000))}M`}
            sub="약 10만 회/일"
          />
          <StatCard
            label="숨 쉰 횟수"
            value={`~${formatNumber(Math.round(stats.breaths / 1000000))}M`}
            sub="약 2.3만 회/일"
          />
          <StatCard
            label="일출"
            value={`${formatNumber(stats.sunrises)}번`}
            sub="매일 한 번의 새로운 시작"
          />
          <StatCard
            label="수면"
            value={`~${stats.sleepYears}년`}
            sub="인생의 약 1/3"
          />
          <StatCard
            label="계절"
            value={`${formatNumber(stats.seasons)}번`}
            sub="봄, 여름, 가을, 겨울"
          />
          <StatCard
            label="보름달"
            value={`${formatNumber(stats.fullMoons)}번`}
            sub="약 29.5일 주기"
          />
          <StatCard
            label="시간"
            value={formatNumber(stats.hoursLived)}
            sub="한 시간도 되돌릴 수 없습니다"
          />
        </div>
      </div>

      {/* Fun comparisons */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">재미있는 비교</h2>
        <p className="text-[11px] text-muted-foreground">
          당신이 살아오면서 축적한 놀라운 숫자들
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {funData.comparisons.map((c) => (
            <ComparisonCard key={c.label} {...c} />
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">인생 이정표</h2>
        <p className="text-[11px] text-muted-foreground">특별한 숫자의 날들</p>
        <div className="space-y-2">
          {funData.milestones.map((m) => {
            const dateStr = m.date.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            return (
              <div
                key={m.label}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 sm:p-4 transition-colors",
                  m.isPast
                    ? "border-border/40 bg-muted/20"
                    : "border-blue-500/20 bg-blue-500/5"
                )}
              >
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground">{dateStr}</p>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    m.isPast
                      ? "bg-muted text-muted-foreground"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  )}
                >
                  {m.isPast ? "달성" : "예정"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week grid */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">주 단위 그리드</h2>
          <p className="text-[11px] text-muted-foreground">
            각 점은 1주를 나타냅니다. {EXPECTED_LIFESPAN}년 = {formatNumber(TOTAL_WEEKS)}주
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/80 p-3 sm:p-5">
          <WeekGrid weeksLived={stats.weeksLived} />
        </div>
      </div>

      {/* Reflection */}
      <div className="rounded-xl border border-border/40 bg-muted/30 p-5 sm:p-6 space-y-3 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          당신에게는 아직{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(stats.weeksRemaining)}주
          </span>
          가 남아 있습니다.
          <br />
          <span className="text-xs">오늘 하루를 어떻게 보내고 싶으신가요?</span>
        </p>
        <p className="text-[10px] text-muted-foreground/50">
          &ldquo;Good design is as little design as possible&rdquo; &mdash; Dieter Rams
        </p>
      </div>
    </div>
  );
}
