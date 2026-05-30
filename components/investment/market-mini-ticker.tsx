"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, ArrowUpRight, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndexItem {
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

export default function MarketMiniTicker() {
  const [items, setItems] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/investment/indices", { cache: "no-store" });
        const j = await r.json();
        setItems(Array.isArray(j.items) ? j.items : []);
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60_000); // 1분마다 갱신
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {(loading && !items.length
          ? Array.from({ length: 3 }).map(() => null)
          : items
        ).map((it, i) => (
          <div
            key={i}
            className="min-w-[150px] flex-1 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-sm sm:min-w-[170px]"
          >
            {it ? (
              <>
                <div className="type-label-medium text-white/70">{it.name}</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-white">
                  {it.value.toLocaleString("ko-KR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
             
              </>
            ) : (
              <div className="animate-pulse space-y-2">
                <div className="h-3 w-12 rounded bg-white/25" />
                <div className="h-6 w-24 rounded bg-white/25" />
                <div className="h-3 w-16 rounded bg-white/25" />
              </div>
            )}
          </div>
        ))}
      </div>

      <a
        href="/investment"
        className="inline-flex items-center gap-1 type-label-large font-semibold text-white/85 transition-colors hover:text-white"
      >
        투자 페이지 보기
        <ArrowUpRight className="h-4 w-4" />
      </a>
    </div>
  );
}
