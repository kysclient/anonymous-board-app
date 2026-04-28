"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fmtInt, fmtBig, isNum, safeNum } from "@/lib/investment/format";
import { AnimatedNumber } from "./animated-number";

interface Quote {
  ticker: string;
  name?: string;
  price?: number;
  prevClose?: number;
  changeRate?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  tradingValue?: number;
}

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  ticker: string;
  name: string;
}

export function ChartHero({ ticker, name }: Props) {
  // 종목별 시세/차트 캐시 (전환 시 즉시 옛 데이터 표시 → 새 데이터 도착하면 부드럽게 갱신)
  const quotesCache = useRef<Record<string, Quote>>({});
  const candlesCache = useRef<Record<string, Record<number, any[]>>>({});

  const [quote, setQuote] = useState<Quote | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState<30 | 60 | 90 | 180>(60);
  const [firstQuoteLoaded, setFirstQuoteLoaded] = useState(false);
  const [firstChartLoaded, setFirstChartLoaded] = useState(false);

  // 종목 변경 시 — 옛 캐시 즉시 표시, 새 데이터 fetch
  useEffect(() => {
    // 캐시에서 즉시 복원
    setQuote(quotesCache.current[ticker] || null);
    setData(candlesCache.current[ticker]?.[period] || []);

    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/investment/quotes?tickers=${ticker}`, {
          cache: "no-store",
        });
        const j = await r.json();
        const it = j.items?.[0];
        if (
          !cancelled &&
          it &&
          !it.error &&
          isNum(it.price) &&
          it.price > 0
        ) {
          quotesCache.current[ticker] = it;
          setQuote(it);
          setFirstQuoteLoaded(true);
        }
      } catch {}
    };
    load();
    const t = setInterval(load, 5_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [ticker]);

  // 일봉
  useEffect(() => {
    let cancelled = false;
    const cached = candlesCache.current[ticker]?.[period];
    if (cached?.length) setData(cached);

    const load = async () => {
      try {
        const r = await fetch(
          `/api/investment/candles/${ticker}?days=${period}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (cancelled) return;
        const candles: Candle[] = j.candles || [];
        const formatted = candles
          .filter((c) => c?.date && isNum(c.close))
          .map((c) => ({
            date: `${c.date.slice(4, 6)}/${c.date.slice(6, 8)}`,
            close: safeNum(c.close),
            volume: safeNum(c.volume),
          }));
        if (formatted.length > 0) {
          if (!candlesCache.current[ticker]) candlesCache.current[ticker] = {};
          candlesCache.current[ticker][period] = formatted;
          setData(formatted);
          setFirstChartLoaded(true);
        }
      } catch {}
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [ticker, period]);

  const price = safeNum(quote?.price);
  const prevClose = safeNum(quote?.prevClose);
  const rate = safeNum(quote?.changeRate);
  const diff = price - prevClose;
  const up = rate >= 0;
  const lineColor = up ? "#f04452" : "#3182f6";
  const showQuoteSkeleton = !quote && !firstQuoteLoaded;
  const showChartSkeleton = data.length === 0 && !firstChartLoaded;

  return (
    <div className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-5 sm:p-6 flex flex-col h-[640px]">
      {/* 종목 헤더 */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {quote?.name || name}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {ticker}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            실시간 5초 갱신
          </div>
        </div>
        <div className="text-right">
          {showQuoteSkeleton ? (
            <>
              <div className="h-9 w-40 rounded bg-muted animate-pulse ml-auto" />
              <div className="h-4 w-32 rounded bg-muted/60 animate-pulse mt-2 ml-auto" />
            </>
          ) : (
            <>
              <div className="text-3xl sm:text-4xl font-bold tabular-nums leading-tight">
                <AnimatedNumber
                  value={price}
                  format={(n) => fmtInt(n)}
                  flash
                  duration={350}
                />
                <span className="text-base font-medium text-muted-foreground ml-1">
                  원
                </span>
              </div>
              <div
                className={cn(
                  "text-base font-bold tabular-nums flex items-center gap-1 justify-end mt-0.5 transition-colors",
                  up ? "text-[#f04452]" : "text-[#3182f6]"
                )}
              >
                {up ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {up ? "+" : ""}
                <AnimatedNumber value={diff} format={(n) => fmtInt(n)} duration={350} />
                원 ({up ? "+" : ""}
                <AnimatedNumber
                  value={rate}
                  format={(n) => n.toFixed(2)}
                  duration={350}
                />
                %)
              </div>
            </>
          )}
        </div>
      </div>

      {/* 시고저 + 거래량 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 pb-4 border-b border-[#eef0f3] dark:border-[#252a33]">
        <Stat label="시가" value={fmtInt(quote?.open)} loading={showQuoteSkeleton} />
        <Stat label="고가" value={fmtInt(quote?.high)} cls="text-[#f04452]" loading={showQuoteSkeleton} />
        <Stat label="저가" value={fmtInt(quote?.low)} cls="text-[#3182f6]" loading={showQuoteSkeleton} />
        <Stat label="거래량" value={fmtBig(quote?.volume)} loading={showQuoteSkeleton} />
        <Stat label="거래대금" value={fmtBig(quote?.tradingValue)} loading={showQuoteSkeleton} />
      </div>

      {/* 차트 기간 탭 */}
      <div className="flex gap-1.5 mt-3 mb-1">
        {[
          { v: 30, label: "1개월" },
          { v: 60, label: "3개월" },
          { v: 90, label: "6개월" },
          { v: 180, label: "1년" },
        ].map((p) => (
          <button
            key={p.v}
            onClick={() => setPeriod(p.v as any)}
            className={cn(
              "text-xs font-semibold px-3 py-1 rounded-md transition",
              period === p.v
                ? "bg-[#3182f6] text-white"
                : "text-muted-foreground hover:bg-[#f3f5f7] dark:hover:bg-[#252a33]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 차트 */}
      <div className="flex-1 min-h-[240px]">
        {showChartSkeleton ? (
          <div className="h-full rounded-lg bg-gradient-to-b from-muted/40 to-transparent animate-pulse flex items-end gap-1 px-2 pb-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-muted/60 rounded-t"
                style={{ height: `${30 + Math.sin(i / 3) * 30 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`g-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#eef0f3"
                strokeDasharray="2 2"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#8b95a1" }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={["dataMin - 100", "dataMax + 100"]}
                tick={{ fontSize: 10, fill: "#8b95a1" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  isNum(v)
                    ? v >= 10000
                      ? `${(v / 1000).toFixed(0)}k`
                      : `${v}`
                    : ""
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.96)",
                  border: "1px solid #eef0f3",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v: any) => [`${fmtInt(v)}원`, "종가"]}
              />
              {data[0]?.close && (
                <ReferenceLine
                  y={data[0].close}
                  stroke="#cbd0d6"
                  strokeDasharray="3 3"
                />
              )}
              <Area
                type="monotone"
                dataKey="close"
                stroke={lineColor}
                strokeWidth={2.2}
                fill={`url(#g-${ticker})`}
                animationDuration={500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            데이터를 불러올 수 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  cls,
  loading,
}: {
  label: string;
  value: string;
  cls?: string;
  loading?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {loading ? (
        <div className="h-4 w-14 rounded bg-muted animate-pulse mt-0.5" />
      ) : (
        <div className={cn("text-sm font-semibold tabular-nums", cls)}>
          {value}
        </div>
      )}
    </div>
  );
}
