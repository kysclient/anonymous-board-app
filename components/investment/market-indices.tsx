"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndexItem {
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

export function MarketIndices() {
  const [items, setItems] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/investment/indices", { cache: "no-store" });
        const j = await r.json();
        setItems(j.items || []);
      } catch {}
      setLoading(false);
    };
    load();
    const t = setInterval(load, 60_000); // 1분
    return () => clearInterval(t);
  }, []);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {(items.length ? items : Array.from({ length: 2 })).map((it, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white dark:bg-[#1a1d24] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-transparent dark:border-[#252a33]"
        >
          {it ? (
            <>
              <div className="text-xs text-muted-foreground mb-2 font-medium">
                {(it as IndexItem).name}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums">
                  {(it as IndexItem).value.toLocaleString("ko-KR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums flex items-center gap-1",
                    (it as IndexItem).changeRate >= 0
                      ? "text-[#f04452]"
                      : "text-[#3182f6]"
                  )}
                >
                  {(it as IndexItem).changeRate >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {(it as IndexItem).changeRate >= 0 ? "+" : ""}
                  {(it as IndexItem).changeRate.toFixed(2)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                {(it as IndexItem).change >= 0 ? "+" : ""}
                {(it as IndexItem).change.toFixed(2)} pt
              </div>
            </>
          ) : (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 w-12 bg-muted rounded" />
              <div className="h-8 w-32 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
