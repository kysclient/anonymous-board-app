"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  rsi,
  bollingerBands,
  atr,
  volumeRatio,
  sma,
} from "@/lib/investment/indicators";
import { cn } from "@/lib/utils";
import { fmtInt, isNum, safeNum } from "@/lib/investment/format";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Volume2,
  Shield,
  RefreshCw,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const MAX_AUTO_RETRY = 2;
const AUTO_RETRY_DELAY = 1500; // ms

export function TechnicalCards({ ticker }: { ticker: string }) {
  // 종목별 일봉 영구 캐시
  const cache = useRef<Record<string, Candle[]>>({});
  const [data, setData] = useState<Candle[]>([]);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const autoRetryCount = useRef(0);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      setErrorMsg(null);

      try {
        const r = await fetch(
          `/api/investment/candles/${ticker}?days=90`,
          { cache: "no-store" }
        );
        const j = await r.json();
        const candles: Candle[] = (j.candles || []).filter(
          (c: any) => c?.date && isNum(c?.close)
        );

        if (candles.length > 0) {
          cache.current[ticker] = candles;
          setData(candles);
          setFirstLoaded(true);
          autoRetryCount.current = 0;
          if (candles.length < 30) {
            setErrorMsg(
              `과거 데이터 ${candles.length}일치만 있어 일부 지표 계산 불가`
            );
          }
        } else if (j.error) {
          setErrorMsg(`KIS 응답 오류: ${j.error}`);
          // 자동 재시도 (1.5초 후)
          if (!manual && autoRetryCount.current < MAX_AUTO_RETRY) {
            autoRetryCount.current++;
            retryTimer.current = setTimeout(() => load(false), AUTO_RETRY_DELAY);
          }
        } else {
          setErrorMsg("데이터를 가져올 수 없습니다");
        }
      } catch (e: any) {
        setErrorMsg(e?.message || "통신 실패");
        if (!manual && autoRetryCount.current < MAX_AUTO_RETRY) {
          autoRetryCount.current++;
          retryTimer.current = setTimeout(() => load(false), AUTO_RETRY_DELAY);
        }
      } finally {
        if (manual) setRefreshing(false);
      }
    },
    [ticker]
  );

  // 종목 변경 시: 캐시 즉시 표시 + 새로 로드
  useEffect(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    autoRetryCount.current = 0;

    if (cache.current[ticker]?.length) {
      setData(cache.current[ticker]);
    } else {
      setData([]);
    }
    setErrorMsg(null);

    load(false);

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [ticker, load]);

  // 첫 진입 + 데이터 X → 스켈레톤
  if (data.length === 0 && !firstLoaded && !errorMsg) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-4"
          >
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse mb-2" />
            <div className="h-6 w-2/3 rounded bg-muted animate-pulse mb-2" />
            <div className="h-3 w-full rounded bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // 에러 / 데이터 부족 — 새로고침 버튼 + 자동 재시도 안내
  if (data.length < 5) {
    return (
      <div className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#f04452]/10 text-[#f04452] mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          {errorMsg || "데이터가 부족합니다"}
        </p>
        <p className="text-[11px] text-muted-foreground mb-4">
          KIS 일시 장애일 수 있습니다.
          {autoRetryCount.current > 0 && autoRetryCount.current < MAX_AUTO_RETRY
            ? ` 자동 재시도 중... (${autoRetryCount.current}/${MAX_AUTO_RETRY})`
            : " 새로고침 버튼을 눌러보세요."}
        </p>
        <Button
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
          className="text-xs"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")}
            strokeWidth={2.5}
          />
          새로고침
        </Button>
      </div>
    );
  }

  // 지표 계산
  const close = data.map((d) => safeNum(d.close));
  const high = data.map((d) => safeNum(d.high));
  const low = data.map((d) => safeNum(d.low));
  const vol = data.map((d) => safeNum(d.volume));
  const last = data.length - 1;

  const ma5 = safeNum(sma(close, 5)[last]);
  const ma20 = safeNum(sma(close, Math.min(20, data.length - 1))[last]);
  const trendUp = ma5 > 0 && ma20 > 0 && ma5 > ma20;
  const rsiVal = safeNum(rsi(close, Math.min(14, data.length - 2))[last], 50);
  const bb = bollingerBands(close, Math.min(20, data.length - 1), 2);
  const pctB = safeNum(bb.pctB[last], 0.5);
  const atrVal = safeNum(
    atr(high, low, close, Math.min(14, data.length - 2))[last]
  );
  const volR = safeNum(volumeRatio(vol, Math.min(20, data.length - 1))[last], 1);
  const cur = safeNum(close[last]);

  const cards: Array<{
    label: string;
    value: string;
    detail: string;
    tone: "up" | "down" | "neutral";
    Icon: LucideIcon;
  }> = [
    {
      label: "이동평균선",
      value: trendUp ? "상승 추세" : "하락 추세",
      detail:
        ma5 > 0 && ma20 > 0
          ? `5일 ${fmtInt(ma5)} / 20일 ${fmtInt(ma20)}`
          : "데이터 부족",
      tone: trendUp ? "up" : "down",
      Icon: trendUp ? TrendingUp : TrendingDown,
    },
    {
      label: "RSI (14)",
      value: rsiVal.toFixed(1),
      detail:
        rsiVal < 30
          ? "과매도 — 반등 기대"
          : rsiVal > 70
          ? "과매수 — 조정 가능"
          : "중립권",
      tone: rsiVal < 30 ? "up" : rsiVal > 70 ? "down" : "neutral",
      Icon: Activity,
    },
    {
      label: "볼린저밴드 %B",
      value: `${(pctB * 100).toFixed(0)}%`,
      detail:
        pctB < 0.1
          ? "하단 — 반등 후보"
          : pctB > 0.9
          ? "상단 — 과열"
          : "밴드 내",
      tone: pctB < 0.1 ? "up" : pctB > 0.9 ? "down" : "neutral",
      Icon: BarChart3,
    },
    {
      label: "거래량 (20일比)",
      value: `${volR.toFixed(1)}x`,
      detail:
        volR > 2.5
          ? "급증 — 큰 관심"
          : volR > 1.5
          ? "증가 — 관심 ↑"
          : volR < 0.7
          ? "감소"
          : "평이",
      tone: volR > 1.5 ? "up" : volR < 0.7 ? "down" : "neutral",
      Icon: Volume2,
    },
    {
      label: "ATR · 변동성",
      value: atrVal > 0 ? `${fmtInt(atrVal)}원` : "—",
      detail:
        atrVal > 0 && cur > 0
          ? `${((atrVal / cur) * 100).toFixed(2)}% / 손절 ${fmtInt(
              cur - 2 * atrVal
            )}`
          : "데이터 부족",
      tone: "neutral",
      Icon: Shield,
    },
  ];

  return (
    <div className="space-y-2">
      {/* 우상단 새로고침 버튼 */}
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing}
          className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <RefreshCw
            className={cn("h-3 w-3 mr-1", refreshing && "animate-spin")}
          />
          {refreshing ? "갱신 중" : "새로고침"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => {
          const cls =
            c.tone === "up"
              ? "text-[#f04452]"
              : c.tone === "down"
              ? "text-[#3182f6]"
              : "text-foreground";
          const iconBg =
            c.tone === "up"
              ? "bg-[#f04452]/10 text-[#f04452]"
              : c.tone === "down"
              ? "bg-[#3182f6]/10 text-[#3182f6]"
              : "bg-[#3182f6]/8 text-[#3182f6]";
          return (
            <div
              key={c.label}
              className="rounded-xl bg-white dark:bg-[#1a1d24] border border-[#eef0f3] dark:border-[#252a33] p-4 hover:shadow-[0_4px_16px_rgba(49,130,246,0.08)] transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-semibold text-muted-foreground">
                  {c.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-lg",
                    iconBg
                  )}
                >
                  <c.Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
              </div>
              <div className={cn("text-xl font-bold tabular-nums", cls)}>
                {c.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1.5 leading-snug line-clamp-2">
                {c.detail}
              </div>
            </div>
          );
        })}
      </div>

      {/* 데이터 일부 부족 안내 (옵션) */}
      {errorMsg && data.length >= 5 && (
        <p className="text-[11px] text-muted-foreground pt-1">⚠ {errorMsg}</p>
      )}
    </div>
  );
}
