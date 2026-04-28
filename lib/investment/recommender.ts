/**
 * 추천 종목 산출 — 100% 기술적 분석 (LLM 비용 0)
 *
 * 목적: "지금 매수 진입하기 좋은 저점 종목" 찾기.
 * 이미 급등한 종목 (peak signal) 은 -점수.
 *
 * 가중치:
 *   1) RSI 과매도 (0.25)            — 낮을수록 +
 *   2) 볼린저 %B 하단 (0.25)        — 낮을수록 +
 *   3) MA20 대비 할인율 (0.25)      — 적정 할인 zone (-3~-7%) +
 *   4) Volume 점진 회복 (0.10)      — 과도한 급증은 - (peak)
 *   5) MA Cross / 추세 (0.15)        — 막 발생한 골든크로스 +, 데드 크로스 - (강한 회피)
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
  score: number;          // -1.0 ~ +1.0 — 매수 매력도
  confidence: number;     // 0.0 ~ 1.0
  components: {
    rsi: number;
    bollinger: number;
    discount: number;     // MA20 대비 할인율 점수
    volume: number;
    trend: number;        // MA Cross / 추세
  };
  currentPrice: number;
  atr: number;
  stopPrice: number;
  targetPrice: number;
  expectedReturn: number; // %
  rationale: string;
}

// 진입 임계치 (공격적 — 매수 후보 자주 잡힘)
const BUY_THRESHOLD = 0.15;
const SELL_THRESHOLD = -0.15;
const MIN_CONFIDENCE = 0.25;
const ATR_STOP_MULT = 1.5;
const ATR_TARGET_MULT = 4.0;

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

  // ───── 1. RSI: 과매도 강한 매수 신호 ─────
  const rsiSeries = rsi(close, 14);
  const rsiNow = rsiSeries[lastIdx] || 50;
  let rsiComp: number;
  if (rsiNow < 25) rsiComp = 1.0;             // 극단적 과매도
  else if (rsiNow < 35) rsiComp = 0.8;        // 과매도
  else if (rsiNow < 45) rsiComp = 0.4;        // 약간 매수권
  else if (rsiNow < 55) rsiComp = 0;          // 중립
  else if (rsiNow < 65) rsiComp = -0.3;
  else if (rsiNow < 75) rsiComp = -0.6;       // 과매수 — peak 위험
  else rsiComp = -1.0;                         // 극단적 과매수 — 진입 X

  // ───── 2. Bollinger %B: 하단 = 매수 기회 ─────
  const bb = bollingerBands(close, 20, 2);
  const pctB = bb.pctB[lastIdx];
  const pctBSafe = typeof pctB === "number" ? pctB : 0.5;
  let bbComp: number;
  if (pctBSafe < 0) bbComp = 1.0;              // 하단 이탈 (강한 반등 후보)
  else if (pctBSafe < 0.15) bbComp = 0.8;      // 하단 근처
  else if (pctBSafe < 0.3) bbComp = 0.4;
  else if (pctBSafe < 0.5) bbComp = 0;
  else if (pctBSafe < 0.7) bbComp = -0.2;
  else if (pctBSafe < 0.85) bbComp = -0.5;
  else bbComp = -1.0;                          // 상단 = peak

  // ───── 3. MA20 대비 할인율: -3~-7% = 베스트 매수 zone ─────
  const ma20 = sma(close, 20);
  const ma20Now = ma20[lastIdx] || current;
  const discountPct = ((current - ma20Now) / ma20Now) * 100;
  let discComp: number;
  if (discountPct < -12) discComp = 0.3;       // 너무 큰 하락 = 떨어지는 칼날
  else if (discountPct < -7) discComp = 0.7;   // 큰 할인
  else if (discountPct < -3) discComp = 1.0;   // 베스트 zone
  else if (discountPct < 0) discComp = 0.7;    // 약한 할인
  else if (discountPct < 2) discComp = 0.2;
  else if (discountPct < 5) discComp = -0.3;
  else if (discountPct < 10) discComp = -0.7;
  else discComp = -1.0;                         // 너무 올라감

  // ───── 4. Volume: 과도한 급증은 -, 점진 회복은 + ─────
  const vr = volumeRatio(vol, 20);
  const volRatio = vr[lastIdx] || 1;
  let volComp: number;
  if (volRatio > 4) volComp = -0.5;            // 과도한 급증 = peak 가능성
  else if (volRatio > 2.5) volComp = -0.1;     // 약한 - (조심)
  else if (volRatio > 1.3) volComp = 0.5;      // 점진 증가 = 좋음
  else if (volRatio > 0.8) volComp = 0.3;      // 평이
  else if (volRatio > 0.5) volComp = 0.1;
  else volComp = -0.2;                         // 너무 적은 거래

  // ───── 5. MA Cross / 추세: 막 발생한 골든크로스 + 보너스 ─────
  const ma5 = sma(close, 5);
  const cross = maCrossSignal(close, 5, 20);
  const ma5Now = ma5[lastIdx] || current;
  const trendUp = ma5Now > ma20Now;
  let trendComp: number;
  if (cross[lastIdx] === 1) {
    trendComp = 1.0;                           // 막 골든크로스 = 강한 매수
  } else if (cross[lastIdx] === -1) {
    trendComp = -1.0;                          // 데드크로스 = 회피
  } else if (trendUp && rsiNow < 50) {
    trendComp = 0.4;                           // 상승추세 + 과매수 X
  } else if (trendUp && rsiNow >= 65) {
    trendComp = -0.3;                          // 상승추세지만 과매수 = 진입 늦음
  } else if (!trendUp && rsiNow < 35) {
    trendComp = 0.3;                           // 하락추세에서 과매도 (반등 노림)
  } else if (!trendUp) {
    trendComp = -0.3;                          // 하락추세 (떨어지는 칼날 주의)
  } else {
    trendComp = 0;
  }

  // ───── 가중 합 ─────
  const score = Math.max(
    -1,
    Math.min(
      1,
      0.25 * rsiComp +
        0.25 * bbComp +
        0.25 * discComp +
        0.10 * volComp +
        0.15 * trendComp
    )
  );

  // confidence: 5개 지표 방향 일치도
  const dirs: number[] = [
    rsiComp,
    bbComp,
    discComp,
    volComp,
    trendComp,
  ].map((v) => (v > 0.1 ? 1 : v < -0.1 ? -1 : 0));
  const nonZero = dirs.filter((d) => d !== 0).length;
  const conf =
    nonZero === 0
      ? 0
      : Math.abs(dirs.reduce((a: number, b: number) => a + b, 0)) / nonZero;

  let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
  if (score >= BUY_THRESHOLD && conf >= MIN_CONFIDENCE) signal = "BUY";
  else if (score <= SELL_THRESHOLD && conf >= MIN_CONFIDENCE) signal = "SELL";

  // 손절/익절
  const atrSeries = atr(high, low, close, 14);
  const atrNow = atrSeries[lastIdx] || current * 0.02;
  const stopPrice = current - ATR_STOP_MULT * atrNow;
  const targetPrice = current + ATR_TARGET_MULT * atrNow;
  const expectedReturn = ((targetPrice - current) / current) * 100;

  // 근거 — 매수 진입 관점
  const reasons: string[] = [];
  if (cross[lastIdx] === 1) reasons.push("골든크로스 발생");
  if (rsiNow < 30) reasons.push(`RSI 과매도(${rsiNow.toFixed(0)})`);
  else if (rsiNow < 40) reasons.push(`RSI 매수권(${rsiNow.toFixed(0)})`);
  else if (rsiNow > 70) reasons.push(`RSI 과매수(${rsiNow.toFixed(0)})`);
  if (pctBSafe < 0.15) reasons.push("볼밴 하단 — 반등 후보");
  else if (pctBSafe > 0.85) reasons.push("볼밴 상단 — 과열");
  if (discountPct >= -7 && discountPct <= -3)
    reasons.push(`MA20 대비 ${discountPct.toFixed(1)}% 할인`);
  else if (discountPct < -10)
    reasons.push(`MA20 -${(-discountPct).toFixed(1)}% (큰 하락 주의)`);
  if (volRatio > 1.3 && volRatio < 2.5)
    reasons.push(`거래량 점진 증가(${volRatio.toFixed(1)}x)`);
  else if (volRatio > 4) reasons.push(`거래량 과열(${volRatio.toFixed(1)}x)`);
  if (cross[lastIdx] === -1) reasons.push("데드크로스 — 회피");
  const rationale = reasons.length ? reasons.join(" · ") : "지표 중립";

  return {
    ticker,
    signal,
    score: Math.round(score * 1000) / 1000,
    confidence: Math.round(conf * 100) / 100,
    components: {
      rsi: Math.round(rsiComp * 1000) / 1000,
      bollinger: Math.round(bbComp * 1000) / 1000,
      discount: Math.round(discComp * 1000) / 1000,
      volume: Math.round(volComp * 1000) / 1000,
      trend: Math.round(trendComp * 1000) / 1000,
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
 * BUY → 점수≥0 → 점수 상위 순으로 보충해서 항상 N개 채움.
 */
export function rankRecommendations(
  scores: RecommendationScore[],
  topN = 10
): RecommendationScore[] {
  const byStrength = (a: RecommendationScore, b: RecommendationScore) =>
    b.score * Math.max(0.3, b.confidence) -
    a.score * Math.max(0.3, a.confidence);

  const buys = scores.filter((s) => s.signal === "BUY").sort(byStrength);
  if (buys.length >= topN) return buys.slice(0, topN);

  const positives = scores
    .filter((s) => s.signal !== "BUY" && s.score >= 0)
    .sort(byStrength);

  const merged = [...buys, ...positives];
  if (merged.length >= topN) return merged.slice(0, topN);

  const rest = scores.filter((s) => !merged.includes(s)).sort(byStrength);
  return [...merged, ...rest].slice(0, topN);
}
