/**
 * 추천 종목 산출 — 100% 기술적 분석 (LLM 비용 0)
 *
 * 5개 지표 가중 합산:
 *   MA Cross (0.30) + RSI (0.20) + Bollinger (0.20) + Volume (0.30)
 *   ATR은 점수에 안 들어가고, 손절선 계산에만 사용.
 */

import {
  rsi,
  bollingerBands,
  atr,
  maCrossSignal,
  sma,
  volumeRatio,
} from "./indicators";
import type { DailyCandle } from "./kis-client";

export interface RecommendationScore {
  ticker: string;
  signal: "BUY" | "SELL" | "HOLD";
  score: number;          // -1.0 ~ +1.0
  confidence: number;     // 0.0 ~ 1.0
  components: {
    maCross: number;
    rsi: number;
    bollinger: number;
    volume: number;
  };
  currentPrice: number;
  atr: number;
  stopPrice: number;      // entry - 2*ATR
  targetPrice: number;    // entry + 4*ATR (R:R 1:2)
  expectedReturn: number; // %
  rationale: string;
}

// 공격적 모드: 시그널 자주 잡힘
const BUY_THRESHOLD = 0.10;
const SELL_THRESHOLD = -0.10;
const MIN_CONFIDENCE = 0.25;
const ATR_STOP_MULT = 1.5;
const ATR_TARGET_MULT = 4.0;

/**
 * 일봉 시리즈를 받아 종목 점수와 시그널 산출.
 */
export function scoreFromCandles(
  ticker: string,
  candles: DailyCandle[]
): RecommendationScore | null {
  if (candles.length < 30) return null;

  const close = candles.map((c) => c.close);
  const high = candles.map((c) => c.high);
  const low = candles.map((c) => c.low);
  const vol = candles.map((c) => c.volume);

  const lastIdx = candles.length - 1;
  const current = close[lastIdx];
  if (current <= 0) return null;

  // 1. MA Cross (5/20) + 추세
  const ma5 = sma(close, 5);
  const ma20 = sma(close, 20);
  const cross = maCrossSignal(close, 5, 20);
  const trendUp = ma5[lastIdx] > ma20[lastIdx];

  let maComp: number;
  if (cross[lastIdx] === 1) maComp = 1.0;
  else if (cross[lastIdx] === -1) maComp = -1.0;
  else maComp = trendUp ? 0.3 : -0.3;

  // 2. RSI (14)
  const rsiSeries = rsi(close, 14);
  const rsiNow = rsiSeries[lastIdx] || 50;
  let rsiComp: number;
  if (rsiNow < 30) rsiComp = (30 - rsiNow) / 30;
  else if (rsiNow > 70) rsiComp = -(rsiNow - 70) / 30;
  else rsiComp = (50 - rsiNow) / 100;

  // 3. Bollinger (20, 2σ)
  const bb = bollingerBands(close, 20, 2);
  const pctB = bb.pctB[lastIdx] || 0.5;
  let bbComp: number;
  if (pctB < 0.05) bbComp = 1.0;
  else if (pctB < 0.2) bbComp = 0.5;
  else if (pctB > 0.95) bbComp = -1.0;
  else if (pctB > 0.8) bbComp = -0.5;
  else bbComp = 0;

  // 4. Volume (직전 20일 평균 대비)
  const vr = volumeRatio(vol, 20);
  const volRatio = vr[lastIdx] || 1;
  let volComp: number;
  if (volRatio > 2.5) volComp = trendUp ? 1.0 : -1.0;
  else if (volRatio > 1.5) volComp = trendUp ? 0.5 : -0.3;
  else volComp = 0;

  // 가중 합
  const score = Math.max(
    -1,
    Math.min(
      1,
      0.3 * maComp + 0.2 * rsiComp + 0.2 * bbComp + 0.3 * volComp
    )
  );

  // confidence: 4개 지표 방향 일치도
  const dirs: number[] = [maComp, rsiComp, bbComp, volComp].map((v) =>
    v > 0.1 ? 1 : v < -0.1 ? -1 : 0
  );
  const nonZero = dirs.filter((d) => d !== 0).length;
  const conf =
    nonZero === 0 ? 0 : Math.abs(dirs.reduce((a: number, b: number) => a + b, 0)) / nonZero;

  let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
  if (score >= BUY_THRESHOLD && conf >= MIN_CONFIDENCE) signal = "BUY";
  else if (score <= SELL_THRESHOLD && conf >= MIN_CONFIDENCE) signal = "SELL";

  // ATR 기반 손절/익절
  const atrSeries = atr(high, low, close, 14);
  const atrNow = atrSeries[lastIdx] || current * 0.02;
  const stopPrice = current - ATR_STOP_MULT * atrNow;
  const targetPrice = current + ATR_TARGET_MULT * atrNow;
  const expectedReturn = ((targetPrice - current) / current) * 100;

  // 근거 텍스트
  const reasons: string[] = [];
  if (cross[lastIdx] === 1) reasons.push("골든크로스 발생");
  else if (cross[lastIdx] === -1) reasons.push("데드크로스 발생");
  if (rsiNow < 30) reasons.push(`RSI 과매도(${rsiNow.toFixed(0)})`);
  else if (rsiNow > 70) reasons.push(`RSI 과매수(${rsiNow.toFixed(0)})`);
  if (pctB < 0.1) reasons.push("볼밴 하단");
  else if (pctB > 0.9) reasons.push("볼밴 상단");
  if (volRatio > 2.5) reasons.push(`거래량 급증(${volRatio.toFixed(1)}x)`);
  else if (volRatio > 1.5) reasons.push(`거래량 증가(${volRatio.toFixed(1)}x)`);
  const rationale = reasons.length ? reasons.join(", ") : "지표 중립";

  return {
    ticker,
    signal,
    score: Math.round(score * 1000) / 1000,
    confidence: Math.round(conf * 100) / 100,
    components: {
      maCross: Math.round(maComp * 1000) / 1000,
      rsi: Math.round(rsiComp * 1000) / 1000,
      bollinger: Math.round(bbComp * 1000) / 1000,
      volume: Math.round(volComp * 1000) / 1000,
    },
    currentPrice: Math.round(current),
    atr: Math.round(atrNow),
    stopPrice: Math.round(stopPrice),
    targetPrice: Math.round(targetPrice),
    expectedReturn: Math.round(expectedReturn * 100) / 100,
    rationale,
  };
}

/**
 * 여러 종목 점수 → 상위 N개 추천.
 *
 * 1차: BUY 시그널 종목 정렬
 * 2차 (BUY 부족 시): 점수 ≥ 0 종목 중 상위
 * 3차 (그래도 부족 시): 점수 상위 (HOLD 포함)
 *
 * 항상 가능한 한 N개를 채워서 반환 (실서비스 느낌).
 */
export function rankRecommendations(
  scores: RecommendationScore[],
  topN = 10
): RecommendationScore[] {
  const byStrength = (a: RecommendationScore, b: RecommendationScore) =>
    b.score * Math.max(0.3, b.confidence) -
    a.score * Math.max(0.3, a.confidence);

  // 1차: 명확한 BUY
  const buys = scores.filter((s) => s.signal === "BUY").sort(byStrength);
  if (buys.length >= topN) return buys.slice(0, topN);

  // 2차: 점수 양수인 HOLD 보충
  const positives = scores
    .filter((s) => s.signal !== "BUY" && s.score >= 0)
    .sort(byStrength);

  const merged = [...buys, ...positives];
  if (merged.length >= topN) return merged.slice(0, topN);

  // 3차: 점수 상위 전체
  const rest = scores
    .filter((s) => !merged.includes(s))
    .sort(byStrength);
  return [...merged, ...rest].slice(0, topN);
}
