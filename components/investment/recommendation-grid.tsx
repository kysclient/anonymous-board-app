"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtInt, safeNum } from "@/lib/investment/format";
import { AnimatedNumber } from "./animated-number";

interface RecItem {
  ticker: string;
  name?: string;
  rank?: number;
  score?: number;
  confidence?: number;
  signal?: "BUY" | "SELL" | "HOLD";
  components?: any;
  rationale?: string;
  currentPrice?: number;
  targetPrice?: number;
  stopPrice?: number;
  expectedReturn?: number;
  market?: string;
  sector?: string;
}

interface Props {
  onSelectTicker: (ticker: string, name?: string) => void;
  selectedTicker: string | null;
  refreshKey?: number;
  onRefresh?: () => void;
}

export function RecommendationGrid({
  onSelectTicker,
  selectedTicker,
  refreshKey = 0,
  onRefresh,
}: Props) {
  const [items, setItems] = useState<RecItem[]>([]);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [error, setError] = useState<string>("");
  // 직전 종목 set — NEW 배지 표시
  const prevTickers = useRef<Set<string>>(new Set());
  const [newTickers, setNewTickers] = useState<Set<string>>(new Set());

  const load = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    setError("");
    try {
      const url = `/api/investment/recommendations?topN=10${
        forceRefresh ? "&cache=false" : ""
      }`;
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      if (j.error) setError(j.error);
      const newItems: RecItem[] = j.items || [];

      if (firstLoaded) {
        const fresh = new Set<string>();
        for (const it of newItems) {
          if (!prevTickers.current.has(it.ticker)) fresh.add(it.ticker);
        }
        if (fresh.size > 0) {
          setNewTickers(fresh);
          setTimeout(() => setNewTickers(new Set()), 5000);
        }
      }

      prevTickers.current = new Set(newItems.map((i) => i.ticker));
      setItems(newItems);
      setGeneratedAt(j.generatedAt || "");
      setFirstLoaded(true);
    } catch (e: any) {
      setError(e?.message || "fetch 실패");
    }
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleRefresh = async () => {
    await load(true);
    onRefresh?.();
  };

  if (!firstLoaded) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-4 h-36"
          >
            <div className="h-4 w-1/3 rounded bg-muted animate-pulse mb-3" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse mb-2" />
            <div className="h-5 w-1/2 rounded bg-muted animate-pulse mb-3" />
            <div className="h-2 w-full rounded bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-10 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {error ||
            "BUY 시그널이 잡힌 종목이 없습니다. 시장 보합 시점에 자주 발생합니다."}
        </p>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          새로 분석
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground tabular-nums">
          {generatedAt &&
            `갱신: ${new Date(generatedAt).toLocaleString("ko-KR", {
              hour12: false,
            })}`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs h-7"
        >
          <RefreshCw
            className={cn("h-3 w-3 mr-1.5", refreshing && "animate-spin")}
          />
          다시 분석
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {items.map((it) => (
          <Card
            key={it.ticker}
            item={it}
            selected={selectedTicker === it.ticker}
            isNew={newTickers.has(it.ticker)}
            onClick={() => onSelectTicker(it.ticker, it.name)}
          />
        ))}
      </div>
    </>
  );
}

function Card({
  item,
  selected,
  isNew,
  onClick,
}: {
  item: RecItem;
  selected: boolean;
  isNew?: boolean;
  onClick: () => void;
}) {
  const isBuy = item.signal === "BUY";
  const cur = safeNum(item.currentPrice);
  const target = safeNum(item.targetPrice);
  const stop = safeNum(item.stopPrice);
  const expected = safeNum(item.expectedReturn);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left rounded-xl bg-white dark:bg-[#1a1d24] border p-4 transition-all overflow-hidden",
        "hover:shadow-[0_6px_24px_rgba(49,130,246,0.10)] hover:-translate-y-0.5",
        selected
          ? "border-[#3182f6] shadow-[0_6px_24px_rgba(49,130,246,0.15)]"
          : "border-[#eef0f3] dark:border-[#252a33]",
        isNew && "ring-2 ring-[#f04452]/40"
      )}
    >
      {isNew && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[9px] font-bold text-white bg-[#f04452] px-1.5 py-0.5 rounded-full animate-pulse">
          <Sparkles className="h-2.5 w-2.5" />
          NEW
        </span>
      )}

      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#3182f6]/10 text-[#3182f6] text-[10px] font-bold">
            {item.rank ?? "-"}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              isBuy
                ? "bg-[#f04452]/10 text-[#f04452]"
                : "bg-[#3182f6]/10 text-[#3182f6]"
            )}
          >
            {item.signal || "—"}
          </span>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#3182f6] transition" />
      </div>

      <div className="mb-2">
        <div className="text-[13px] font-bold truncate">
          {item.name || item.ticker}
        </div>
        <div className="text-[10px] text-muted-foreground tabular-nums">
          {item.ticker} · {item.sector || item.market || ""}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <AnimatedNumber
          value={cur}
          format={(n) => fmtInt(n)}
          className="text-[15px] font-bold tabular-nums"
          duration={400}
        />
        <span className="text-xs font-semibold text-[#f04452] tabular-nums">
          +{expected.toFixed(1)}%
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 leading-snug">
        {item.rationale || "지표 종합"}
      </p>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums pt-2 border-t border-[#eef0f3] dark:border-[#252a33]">
        <span>🎯 {fmtInt(target)}</span>
        <span>🛡 {fmtInt(stop)}</span>
      </div>
    </button>
  );
}
