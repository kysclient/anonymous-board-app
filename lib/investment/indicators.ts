/**
 * 기술적 지표 — 순수 TypeScript 구현 (LLM 비용 0)
 *
 * RSI / Bollinger / ATR / MA Cross / Volume Ratio
 */

export type Series = number[];

export function sma(values: Series, period: number): Series {
  const out: Series = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Wilder RSI */
export function rsi(close: Series, period = 14): Series {
  const out: Series = new Array(close.length).fill(NaN);
  if (close.length < period + 1) return out;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = close[i] - close[i - 1];
    if (d >= 0) avgGain += d;
    else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < close.length; i++) {
    const d = close[i] - close[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  }
  return out;
}

export interface BollingerResult {
  upper: Series;
  mid: Series;
  lower: Series;
  pctB: Series;     // 0=하단, 1=상단
  bandwidth: Series;
}

export function bollingerBands(
  close: Series,
  period = 20,
  numStd = 2
): BollingerResult {
  const len = close.length;
  const upper: Series = new Array(len).fill(NaN);
  const mid: Series = new Array(len).fill(NaN);
  const lower: Series = new Array(len).fill(NaN);
  const pctB: Series = new Array(len).fill(NaN);
  const bandwidth: Series = new Array(len).fill(NaN);

  for (let i = period - 1; i < len; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += close[j];
    const m = sum / period;
    let varSum = 0;
    for (let j = i - period + 1; j <= i; j++) varSum += (close[j] - m) ** 2;
    const std = Math.sqrt(varSum / period);
    const u = m + numStd * std;
    const l = m - numStd * std;
    upper[i] = u;
    mid[i] = m;
    lower[i] = l;
    pctB[i] = u !== l ? (close[i] - l) / (u - l) : 0.5;
    bandwidth[i] = m !== 0 ? (u - l) / m : 0;
  }
  return { upper, mid, lower, pctB, bandwidth };
}

/** Wilder ATR */
export function atr(
  high: Series,
  low: Series,
  close: Series,
  period = 14
): Series {
  const len = close.length;
  const out: Series = new Array(len).fill(NaN);
  if (len < period + 1) return out;
  const tr: Series = new Array(len).fill(0);
  tr[0] = high[0] - low[0];
  for (let i = 1; i < len; i++) {
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(tr1, tr2, tr3);
  }
  // Wilder smoothing
  let acc = 0;
  for (let i = 1; i <= period; i++) acc += tr[i];
  out[period] = acc / period;
  for (let i = period + 1; i < len; i++) {
    out[i] = (out[i - 1] * (period - 1) + tr[i]) / period;
  }
  return out;
}

/** 거래량 비율 (오늘 / 직전 N일 평균) */
export function volumeRatio(volume: Series, period = 20): Series {
  const len = volume.length;
  const out: Series = new Array(len).fill(NaN);
  for (let i = period; i < len; i++) {
    let sum = 0;
    for (let j = i - period; j < i; j++) sum += volume[j];
    const avg = sum / period;
    out[i] = avg > 0 ? volume[i] / avg : 0;
  }
  return out;
}

/** MA Cross signal: +1 골든, -1 데드, 0 변화 없음 (당일) */
export function maCrossSignal(
  close: Series,
  fast = 5,
  slow = 20
): Series {
  const fastMa = sma(close, fast);
  const slowMa = sma(close, slow);
  const len = close.length;
  const out: Series = new Array(len).fill(0);
  for (let i = 1; i < len; i++) {
    const a = fastMa[i] - slowMa[i];
    const b = fastMa[i - 1] - slowMa[i - 1];
    if (Number.isNaN(a) || Number.isNaN(b)) continue;
    if (b <= 0 && a > 0) out[i] = 1;
    else if (b >= 0 && a < 0) out[i] = -1;
  }
  return out;
}
