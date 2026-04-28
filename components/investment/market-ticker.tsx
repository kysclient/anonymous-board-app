"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";
import { isNum, safeNum } from "@/lib/investment/format";

interface IndexItem {
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

const STORAGE_KEY = "investment.indices.cache.v2";
const SEED: IndexItem[] = [
  { name: "KOSPI", value: 0, change: 0, changeRate: 0 },
  { name: "KOSDAQ", value: 0, change: 0, changeRate: 0 },
  { name: "USD/KRW", value: 0, change: 0, changeRate: 0 },
];

function loadCache(): IndexItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // 모든 값이 0이면 무시
    if (parsed.every((p: any) => !isNum(p?.value) || p.value === 0)) return null;
    return parsed as IndexItem[];
  } catch {
    return null;
  }
}

function saveCache(items: IndexItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function MarketTicker() {
  // 마운트 시 localStorage 우선
  const [items, setItems] = useState<IndexItem[]>(() => loadCache() || SEED);
  const [firstLoaded, setFirstLoaded] = useState<boolean>(() => loadCache() != null);
  const lastGood = useRef<Record<string, IndexItem>>({});

  // 로드된 캐시를 lastGood에도 채워둠
  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      for (const it of cached) lastGood.current[it.name] = it;
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/investment/indices", { cache: "no-store" });
        const j = await r.json();
        const apiItems: any[] = j?.items || [];

        const merged: IndexItem[] = SEED.map((seed) => {
          const fromApi = apiItems.find((x) => x?.name === seed.name);
          if (
            fromApi &&
            isNum(fromApi.value) &&
            fromApi.value > 0 &&
            !fromApi.error
          ) {
            const item: IndexItem = {
              name: seed.name,
              value: safeNum(fromApi.value),
              change: safeNum(fromApi.change),
              changeRate: safeNum(fromApi.changeRate),
            };
            lastGood.current[seed.name] = item;
            return item;
          }
          // 실패 → 옛 정상 값 유지
          if (lastGood.current[seed.name]) return lastGood.current[seed.name];
          return seed;
        });

        // 최소 1개라도 정상이면 캐시 저장
        if (merged.some((m) => m.value > 0)) {
          saveCache(merged);
          setFirstLoaded(true);
        }
        setItems(merged);
      } catch {
        // 무시 - 옛 값 유지
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] px-4 sm:px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      {items.map((it) => {
        const up = it.changeRate >= 0;
        const isLoading = !firstLoaded && it.value === 0;
        return (
          <div
            key={it.name}
            className="flex items-baseline gap-2 whitespace-nowrap"
          >
            <span className="text-[11px] font-bold text-muted-foreground">
              {it.name}
            </span>
            {isLoading ? (
              <span className="inline-block h-3 w-14 rounded bg-muted animate-pulse" />
            ) : (
              <AnimatedNumber
                value={it.value}
                format={(n) =>
                  n.toLocaleString("ko-KR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
                className="text-sm font-bold tabular-nums"
                duration={400}
              />
            )}
            {!isLoading && it.value > 0 && (
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums flex items-center gap-0.5",
                  up ? "text-[#f04452]" : "text-[#3182f6]"
                )}
              >
                {up ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {up ? "+" : ""}
                {it.changeRate.toFixed(2)}%
              </span>
            )}
          </div>
        );
      })}
      <span className="ml-auto text-[11px] text-muted-foreground">
        {firstLoaded ? "실시간 갱신 · 1분 주기" : "연결 중..."}
      </span>
    </div>
  );
}
