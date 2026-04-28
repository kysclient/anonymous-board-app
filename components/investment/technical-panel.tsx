"use client";

import { useEffect, useState } from "react";
import {
  rsi,
  bollingerBands,
  atr,
  volumeRatio,
  sma,
} from "@/lib/investment/indicators";
import { cn } from "@/lib/utils";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function TechnicalPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<Candle[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/investment/candles/${ticker}?days=90`, {
          cache: "no-store",
        });
        const j = await r.json();
        setData(j.candles || []);
      } catch {}
    };
    load();
  }, [ticker]);

  if (data.length < 30) {
    return (
      <div className="rounded-2xl bg-[#f7f8fa] dark:bg-[#1f232b] p-5 h-48 flex items-center justify-center text-xs text-muted-foreground">
        지표 계산 중...
      </div>
    );
  }

  const close = data.map((d) => d.close);
  const high = data.map((d) => d.high);
  const low = data.map((d) => d.low);
  const vol = data.map((d) => d.volume);
  const last = data.length - 1;

  const rsiVal = rsi(close, 14)[last] || 50;
  const bb = bollingerBands(close, 20, 2);
  const pctB = bb.pctB[last] || 0.5;
  const atrVal = atr(high, low, close, 14)[last] || 0;
  const volR = volumeRatio(vol, 20)[last] || 1;
  const ma5 = sma(close, 5)[last] || 0;
  const ma20 = sma(close, 20)[last] || 0;
  const trendUp = ma5 > ma20;
  const currentPrice = close[last];

  return (
    <div className="rounded-2xl bg-[#f7f8fa] dark:bg-[#1f232b] p-5">
      <h4 className="text-sm font-semibold mb-4">기술적 지표</h4>
      <div className="grid grid-cols-2 gap-4">
        <Indicator
          label="추세 (5/20 MA)"
          value={trendUp ? "상승" : "하락"}
          desc={`5일 ${ma5.toFixed(0)} / 20일 ${ma20.toFixed(0)}`}
          tone={trendUp ? "up" : "down"}
        />
        <Indicator
          label="RSI (14)"
          value={rsiVal.toFixed(1)}
          desc={
            rsiVal < 30 ? "과매도 — 반등 기대" :
            rsiVal > 70 ? "과매수 — 조정 가능" :
            "중립권"
          }
          tone={rsiVal < 30 ? "up" : rsiVal > 70 ? "down" : "neutral"}
        />
        <Indicator
          label="볼린저 %B"
          value={(pctB * 100).toFixed(0) + "%"}
          desc={
            pctB < 0.1 ? "하단 — 반등 후보" :
            pctB > 0.9 ? "상단 — 과열" :
            "밴드 내"
          }
          tone={pctB < 0.1 ? "up" : pctB > 0.9 ? "down" : "neutral"}
        />
        <Indicator
          label="거래량"
          value={`${volR.toFixed(1)}x`}
          desc={
            volR > 2.5 ? "급증 — 큰 관심" :
            volR > 1.5 ? "증가" :
            "평이"
          }
          tone={volR > 1.5 ? "up" : "neutral"}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-muted">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">ATR (변동성)</span>
          <span className="font-semibold tabular-nums">
            {atrVal.toFixed(0)}원
            <span className="text-muted-foreground ml-1">
              ({((atrVal / currentPrice) * 100).toFixed(2)}%)
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-muted-foreground">제안 손절선 (현재가-2×ATR)</span>
          <span className="font-semibold text-[#3182f6] tabular-nums">
            {(currentPrice - 2 * atrVal).toLocaleString("ko-KR", {
              maximumFractionDigits: 0,
            })}원
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-muted-foreground">제안 익절선 (현재가+4×ATR)</span>
          <span className="font-semibold text-[#f04452] tabular-nums">
            {(currentPrice + 4 * atrVal).toLocaleString("ko-KR", {
              maximumFractionDigits: 0,
            })}원
          </span>
        </div>
      </div>
    </div>
  );
}

function Indicator({
  label,
  value,
  desc,
  tone,
}: {
  label: string;
  value: string;
  desc: string;
  tone: "up" | "down" | "neutral";
}) {
  const cls =
    tone === "up"
      ? "text-[#f04452]"
      : tone === "down"
      ? "text-[#3182f6]"
      : "text-foreground";
  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-lg font-bold tabular-nums", cls)}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
    </div>
  );
}
