"use client";

import { useEffect, useRef, useState } from "react";
import { fmtInt, safeNum, isNum } from "@/lib/investment/format";
import { AnimatedNumber } from "./animated-number";

interface Level {
  price: number;
  quantity: number;
}
interface OrderBook {
  ticker: string;
  current?: number;
  bids: Level[];
  asks: Level[];
}

export function OrderBookCompact({ ticker }: { ticker: string }) {
  // 종목별 영구 캐시
  const cache = useRef<Record<string, OrderBook>>({});
  const [ob, setOb] = useState<OrderBook | null>(null);
  const [firstLoaded, setFirstLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 캐시에서 즉시 표시
    setOb(cache.current[ticker] || null);

    const load = async () => {
      try {
        const r = await fetch(`/api/investment/orderbook/${ticker}`, {
          cache: "no-store",
        });
        const j = await r.json();
        if (cancelled) return;
        const valid = j?.bids?.length || j?.asks?.length;
        if (valid) {
          cache.current[ticker] = j;
          setOb(j);
          setFirstLoaded(true);
        }
      } catch {}
    };
    load();
    const t = setInterval(load, 2_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [ticker]);

  const bids = (ob?.bids || []).filter((b) => isNum(b?.price));
  const asks = (ob?.asks || []).filter((a) => isNum(a?.price));
  const showSkeleton = !ob && !firstLoaded;

  if (showSkeleton) {
    return (
      <aside className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] h-[640px] flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-2 border-b border-[#eef0f3] dark:border-[#252a33]">
          <h3 className="text-sm font-bold">호가 10단계</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">2초 갱신</p>
        </div>
        <div className="flex-1 p-3 space-y-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkelRow key={`a${i}`} side="ask" />
          ))}
          <div className="my-1.5 h-8 rounded bg-muted animate-pulse" />
          {Array.from({ length: 10 }).map((_, i) => (
            <SkelRow key={`b${i}`} side="bid" />
          ))}
        </div>
      </aside>
    );
  }

  if (!bids.length && !asks.length) {
    return (
      <aside className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] h-[640px] flex items-center justify-center text-xs text-muted-foreground">
        호가 정보 없음
      </aside>
    );
  }

  const maxQty = Math.max(
    ...asks.map((a) => safeNum(a.quantity)),
    ...bids.map((b) => safeNum(b.quantity)),
    1
  );
  const totalBid = bids.reduce((a, b) => a + safeNum(b.quantity), 0);
  const totalAsk = asks.reduce((a, b) => a + safeNum(b.quantity), 0);

  return (
    <aside className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] h-[640px] flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-[#eef0f3] dark:border-[#252a33]">
        <h3 className="text-sm font-bold">호가 10단계</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">2초 갱신</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 text-xs font-mono">
        {asks
          .slice()
          .reverse()
          .map((a, i) => (
            <Row
              key={`a${i}`}
              price={safeNum(a.price)}
              qty={safeNum(a.quantity)}
              maxQty={maxQty}
              side="ask"
            />
          ))}
        <div className="my-1.5 py-2 px-2 bg-[#f3f5f7] dark:bg-[#252a33] rounded-md text-center font-bold tabular-nums">
          <AnimatedNumber
            value={safeNum(ob?.current)}
            format={(n) => fmtInt(n)}
            flash
            duration={350}
          />
        </div>
        {bids.map((b, i) => (
          <Row
            key={`b${i}`}
            price={safeNum(b.price)}
            qty={safeNum(b.quantity)}
            maxQty={maxQty}
            side="bid"
          />
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-[#eef0f3] dark:border-[#252a33] grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <div className="text-muted-foreground">매수 잔량</div>
          <div className="font-semibold text-[#f04452] tabular-nums">
            {fmtInt(totalBid)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">매도 잔량</div>
          <div className="font-semibold text-[#3182f6] tabular-nums">
            {fmtInt(totalAsk)}
          </div>
        </div>
      </div>
    </aside>
  );
}

function Row({
  price,
  qty,
  maxQty,
  side,
}: {
  price: number;
  qty: number;
  maxQty: number;
  side: "ask" | "bid";
}) {
  const pct = (qty / maxQty) * 100;
  const isBid = side === "bid";
  return (
    <div className="relative grid grid-cols-2 gap-2 px-2 py-1 rounded">
      <div
        className={`absolute inset-y-0 right-0 transition-[width] duration-300 ${
          isBid ? "bg-[#f04452]/10" : "bg-[#3182f6]/10"
        } rounded`}
        style={{ width: `${pct}%` }}
      />
      <span
        className={`relative z-10 ${
          isBid ? "text-[#f04452]" : "text-[#3182f6]"
        } font-semibold`}
      >
        {fmtInt(price)}
      </span>
      <span className="relative z-10 text-right text-muted-foreground">
        <AnimatedNumber value={qty} format={(n) => fmtInt(n)} duration={300} />
      </span>
    </div>
  );
}

function SkelRow({ side }: { side: "ask" | "bid" }) {
  return (
    <div className="grid grid-cols-2 gap-2 px-2 py-1">
      <span
        className={`h-3 w-12 rounded animate-pulse ${
          side === "ask" ? "bg-[#3182f6]/15" : "bg-[#f04452]/15"
        }`}
      />
      <span className="h-3 w-10 rounded bg-muted animate-pulse justify-self-end" />
    </div>
  );
}
