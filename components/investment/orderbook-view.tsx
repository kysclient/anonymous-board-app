"use client";

import { useEffect, useState } from "react";

interface Level {
  price: number;
  quantity: number;
}

interface OrderBook {
  ticker: string;
  current: number;
  bids: Level[];
  asks: Level[];
}

export function OrderBookView({ ticker }: { ticker: string }) {
  const [ob, setOb] = useState<OrderBook | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/investment/orderbook/${ticker}`, {
          cache: "no-store",
        });
        const j = await r.json();
        setOb(j);
      } catch {}
    };
    load();
    const t = setInterval(load, 2_000);
    return () => clearInterval(t);
  }, [ticker]);

  if (!ob || (!ob.bids.length && !ob.asks.length)) {
    return (
      <div className="rounded-2xl bg-[#f7f8fa] dark:bg-[#1f232b] p-5 h-72 flex items-center justify-center text-xs text-muted-foreground">
        호가 로딩 중...
      </div>
    );
  }

  const maxQty = Math.max(
    ...ob.asks.map((a) => a.quantity),
    ...ob.bids.map((b) => b.quantity),
    1
  );

  return (
    <div className="rounded-2xl bg-[#f7f8fa] dark:bg-[#1f232b] p-5">
      <h4 className="text-sm font-semibold mb-3">호가</h4>
      <div className="space-y-0.5 text-xs font-mono">
        {/* 매도 호가 (높은 가격 위) */}
        {ob.asks.slice().reverse().map((a, i) => (
          <Row
            key={`a${i}`}
            price={a.price}
            qty={a.quantity}
            maxQty={maxQty}
            side="ask"
          />
        ))}
        {/* 현재가 */}
        <div className="my-1 py-2 px-2 bg-white dark:bg-[#2a2f38] rounded-md text-center font-bold">
          {ob.current.toLocaleString("ko-KR")}
        </div>
        {/* 매수 호가 */}
        {ob.bids.map((b, i) => (
          <Row
            key={`b${i}`}
            price={b.price}
            qty={b.quantity}
            maxQty={maxQty}
            side="bid"
          />
        ))}
      </div>
    </div>
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
        className={`absolute inset-y-0 right-0 ${
          isBid ? "bg-[#f04452]/10" : "bg-[#3182f6]/10"
        } rounded`}
        style={{ width: `${pct}%` }}
      />
      <span
        className={`relative z-10 ${
          isBid ? "text-[#f04452]" : "text-[#3182f6]"
        } font-semibold`}
      >
        {price.toLocaleString("ko-KR")}
      </span>
      <span className="relative z-10 text-right text-muted-foreground tabular-nums">
        {qty.toLocaleString("ko-KR")}
      </span>
    </div>
  );
}
