"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradingValue: number;
}

export function StockChart({ ticker }: { ticker: string }) {
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState<60 | 30 | 90>(60);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(
          `/api/investment/candles/${ticker}?days=${period}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        const candles: Candle[] = j.candles || [];
        const formatted = candles.map((c) => ({
          date: `${c.date.slice(4, 6)}/${c.date.slice(6, 8)}`,
          close: c.close,
          high: c.high,
          low: c.low,
          volume: c.volume,
        }));
        setData(formatted);
      } catch {}
    };
    load();
  }, [ticker, period]);

  if (!data.length) {
    return (
      <div className="h-72 rounded-xl bg-muted/30 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        차트 로딩 중...
      </div>
    );
  }

  const last = data[data.length - 1].close;
  const first = data[0].close;
  const isUp = last >= first;
  const lineColor = isUp ? "#f04452" : "#3182f6";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">차트</h4>
        <div className="flex gap-1">
          {[
            { v: 30, label: "1M" },
            { v: 60, label: "3M" },
            { v: 90, label: "6M" },
          ].map((p) => (
            <button
              key={p.v}
              onClick={() => setPeriod(p.v as any)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                period === p.v
                  ? "bg-[#3182f6] text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#8b95a1" }}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              domain={["dataMin - 100", "dataMax + 100"]}
              tick={{ fontSize: 10, fill: "#8b95a1" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 10000 ? (v / 1000).toFixed(0) + "k" : v.toString()
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                border: "1px solid #e5e8eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(v: any) => [v.toLocaleString("ko-KR") + "원", "종가"]}
            />
            <ReferenceLine y={first} stroke="#cbd0d6" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={2}
              fill={`url(#grad-${ticker})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
