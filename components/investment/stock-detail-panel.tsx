"use client";

import { useEffect, useState } from "react";
import { StockChart } from "./stock-chart";
import { TechnicalPanel } from "./technical-panel";
import { NewsList } from "./news-list";
import { OrderBookView } from "./orderbook-view";
import { cn } from "@/lib/utils";

interface Quote {
  ticker: string;
  name: string;
  price: number;
  prevClose: number;
  changeRate: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  tradingValue: number;
}

interface Props {
  ticker: string;
}

export function StockDetailPanel({ ticker }: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/investment/quotes?tickers=${ticker}`, {
          cache: "no-store",
        });
        const j = await r.json();
        if (j.items?.[0]) setQuote(j.items[0]);
      } catch {}
    };
    load();
    const t = setInterval(load, 5_000);
    return () => clearInterval(t);
  }, [ticker]);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1a1d24] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4 border-b border-muted">
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl sm:text-2xl font-bold">
              {quote?.name || ticker}
            </h3>
            <span className="text-sm text-muted-foreground tabular-nums">
              {ticker}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            5초 자동 갱신 · 차트 + 지표 + 뉴스 + 호가
          </p>
        </div>
        {quote && (
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums">
              {quote.price.toLocaleString("ko-KR")}
              <span className="text-base font-medium text-muted-foreground ml-1">원</span>
            </div>
            <div
              className={cn(
                "text-sm font-semibold tabular-nums",
                quote.changeRate >= 0 ? "text-[#f04452]" : "text-[#3182f6]"
              )}
            >
              {quote.changeRate >= 0 ? "+" : ""}
              {(quote.price - quote.prevClose).toLocaleString("ko-KR")}원 (
              {quote.changeRate >= 0 ? "+" : ""}
              {quote.changeRate.toFixed(2)}%)
            </div>
          </div>
        )}
      </div>

      {/* 시가/고가/저가 등 */}
      {quote && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 border-b border-muted">
          <Stat label="시가" value={quote.open} />
          <Stat label="고가" value={quote.high} cls="text-[#f04452]" />
          <Stat label="저가" value={quote.low} cls="text-[#3182f6]" />
          <Stat label="거래량" value={quote.volume} compact />
          <Stat label="거래대금" value={quote.tradingValue} compact />
        </div>
      )}

      {/* 차트 + 호가 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        <div className="lg:col-span-2">
          <StockChart ticker={ticker} />
        </div>
        <div>
          <OrderBookView ticker={ticker} />
        </div>
      </div>

      {/* 지표 + 뉴스 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TechnicalPanel ticker={ticker} />
        <NewsList query={quote?.name || ticker} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  cls,
  compact,
}: {
  label: string;
  value: number;
  cls?: string;
  compact?: boolean;
}) {
  const display = compact ? formatBig(value) : value.toLocaleString("ko-KR");
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums", cls)}>
        {display}
      </div>
    </div>
  );
}

function formatBig(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "조";
  if (n >= 1e8) return (n / 1e8).toFixed(0) + "억";
  if (n >= 1e4) return (n / 1e4).toFixed(0) + "만";
  return n.toLocaleString("ko-KR");
}
