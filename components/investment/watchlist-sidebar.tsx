"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtInt, safeNum, isNum } from "@/lib/investment/format";
import { AnimatedNumber } from "./animated-number";
import { Search, Plus, Loader2 } from "lucide-react";

interface Quote {
  ticker: string;
  name?: string;
  price?: number;
  changeRate?: number;
}

interface WatchlistItem {
  ticker: string;
  name: string;
  market: string;
  source: string;
}

interface SearchHit {
  ticker: string;
  name: string;
  market: string;
  sector?: string;
}

interface Props {
  selectedTicker: string;
  onSelect: (ticker: string, name: string) => void;
}

export function WatchlistSidebar({ selectedTicker, onSelect }: Props) {
  const [list, setList] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [filter, setFilter] = useState<"ALL" | "KOSPI" | "KOSDAQ">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [globalHits, setGlobalHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const goodQuotes = useRef<Record<string, Quote>>({});

  // 워치리스트 로드 (재호출 가능)
  const loadWatchlist = async () => {
    try {
      const r = await fetch("/api/investment/watchlist");
      const j = await r.json();
      setList(j.items || []);
    } catch {}
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  // 시세 폴링
  useEffect(() => {
    if (!list.length) return;
    const tickers = list.map((l) => l.ticker).slice(0, 60);
    const load = async () => {
      try {
        const r = await fetch(
          `/api/investment/quotes?tickers=${tickers.join(",")}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        for (const q of j.items || []) {
          if (q?.ticker && isNum(q.price) && q.price > 0) {
            goodQuotes.current[q.ticker] = q;
          }
        }
        setQuotes({ ...goodQuotes.current });
        setFirstLoaded(true);
      } catch {}
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [list]);

  // 검색어 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // 글로벌 검색
  useEffect(() => {
    if (debouncedSearch.length < 1) {
      setGlobalHits([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    fetch(
      `/api/investment/tickers/search?q=${encodeURIComponent(debouncedSearch)}&limit=20`
    )
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const watchlistSet = new Set(list.map((l) => l.ticker));
        // 워치리스트에 이미 있는 것은 제외
        setGlobalHits(
          (j.items || []).filter((it: SearchHit) => !watchlistSet.has(it.ticker))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, list]);

  const filtered = list.filter((l) => {
    if (filter !== "ALL" && l.market !== filter) return false;
    if (debouncedSearch) {
      // 검색어 있으면 워치리스트도 필터
      const q = debouncedSearch;
      if (!l.name.includes(q) && !l.ticker.includes(q)) return false;
    }
    return true;
  });

  const handleAddAndSelect = async (hit: SearchHit) => {
    setAdding(hit.ticker);
    try {
      await fetch("/api/investment/watchlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: hit.ticker,
          source: "MANUAL",
        }),
      });
      // 워치리스트 즉시 새로고침
      await loadWatchlist();
      // 검색창 비우고 선택
      setSearch("");
      onSelect(hit.ticker, hit.name);
    } catch {}
    setAdding(null);
  };

  return (
    <aside className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] flex flex-col h-[640px] overflow-hidden">
      <div className="px-4 pt-4 pb-2 border-b border-[#eef0f3] dark:border-[#252a33]">
        <h3 className="text-sm font-bold mb-2.5">관심종목</h3>
        <div className="flex gap-1.5">
          {(["ALL", "KOSPI", "KOSDAQ"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-md transition",
                filter === tab
                  ? "bg-[#3182f6] text-white"
                  : "bg-[#f3f5f7] dark:bg-[#252a33] text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "ALL" ? "전체" : tab}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="전체 종목 검색 (이름/코드)"
            className="w-full text-xs pl-7 pr-2.5 py-1.5 rounded-md bg-[#f3f5f7] dark:bg-[#252a33] border-0 outline-none focus:ring-2 focus:ring-[#3182f6]"
          />
          {searching && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_75px_60px] gap-2 px-4 py-1.5 text-[10px] text-muted-foreground border-b border-[#eef0f3] dark:border-[#252a33] font-medium">
        <span>종목</span>
        <span className="text-right">현재가</span>
        <span className="text-right">전일대비</span>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {!firstLoaded && list.length === 0 && <SkeletonRows count={12} />}

        {/* 워치리스트 매칭 결과 */}
        {filtered.map((it) => {
          const q = quotes[it.ticker];
          const price = safeNum(q?.price);
          const rate = safeNum(q?.changeRate);
          const up = rate > 0;
          const down = rate < 0;
          const noPrice = price === 0;

          return (
            <li key={it.ticker}>
              <button
                onClick={() => onSelect(it.ticker, it.name)}
                className={cn(
                  "w-full grid grid-cols-[1fr_75px_60px] gap-2 px-4 py-2 text-left transition border-l-2 border-transparent",
                  selectedTicker === it.ticker
                    ? "bg-[#3182f6]/5 border-l-[#3182f6]"
                    : "hover:bg-[#f7f8fa] dark:hover:bg-[#1f232b]"
                )}
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold truncate">
                    {it.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {it.ticker} · {it.source}
                  </div>
                </div>
                <div className="text-right tabular-nums self-center">
                  {noPrice ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <AnimatedNumber
                      value={price}
                      format={(n) => fmtInt(n)}
                      flash
                      duration={350}
                      className={cn(
                        "text-xs font-semibold",
                        up && "text-[#f04452]",
                        down && "text-[#3182f6]"
                      )}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    "text-right text-xs font-semibold tabular-nums self-center",
                    up && "text-[#f04452]",
                    down && "text-[#3182f6]"
                  )}
                >
                  {noPrice ? "—" : `${up ? "+" : ""}${rate.toFixed(2)}%`}
                </div>
              </button>
            </li>
          );
        })}

        {/* 검색어 있을 때 — 워치리스트에 없는 전체 종목 결과 */}
        {debouncedSearch && globalHits.length > 0 && (
          <>
            <li className="px-4 pt-3 pb-1.5 sticky top-0 bg-white dark:bg-[#1a1d24] border-y border-[#eef0f3] dark:border-[#252a33]">
              <div className="text-[10px] font-bold text-muted-foreground tracking-wide">
                전체 종목에서 ({globalHits.length})
              </div>
            </li>
            {globalHits.map((hit) => (
              <li key={`hit-${hit.ticker}`}>
                <button
                  onClick={() => handleAddAndSelect(hit)}
                  disabled={adding === hit.ticker}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[#f7f8fa] dark:hover:bg-[#1f232b] transition border-l-2 border-transparent disabled:opacity-60"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold truncate">
                      {hit.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {hit.ticker} · {hit.market}
                      {hit.sector && ` · ${hit.sector}`}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0",
                      "bg-[#3182f6]/10 text-[#3182f6] hover:bg-[#3182f6] hover:text-white transition"
                    )}
                  >
                    {adding === hit.ticker ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </>
        )}

        {/* 검색 결과 0건 */}
        {debouncedSearch &&
          filtered.length === 0 &&
          globalHits.length === 0 &&
          !searching && (
            <li className="px-4 py-8 text-center text-xs text-muted-foreground">
              "{debouncedSearch}" 결과 없음
            </li>
          )}

        {/* 검색 X + 워치리스트 비어있음 */}
        {!debouncedSearch && firstLoaded && filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-xs text-muted-foreground">
            관심종목을 검색해서 추가해 보세요
          </li>
        )}
      </ul>

      <div className="px-4 py-2 border-t border-[#eef0f3] dark:border-[#252a33] text-[11px] text-muted-foreground">
        {firstLoaded
          ? `${filtered.length}/${list.length}개 · 5초 갱신`
          : "연결 중..."}
      </div>
    </aside>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="px-4 py-2.5 grid grid-cols-[1fr_75px_60px] gap-2">
          <div className="space-y-1">
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-2 w-12 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="h-3 w-12 rounded bg-muted animate-pulse self-center justify-self-end" />
          <div className="h-3 w-10 rounded bg-muted animate-pulse self-center justify-self-end" />
        </li>
      ))}
    </>
  );
}
