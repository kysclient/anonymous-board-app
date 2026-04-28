/**
 * 안전한 숫자 포맷터.
 * undefined/null/NaN 들어와도 절대 에러 안 남.
 */

export function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** 1,234,567 형태. 잘못된 값이면 dash. */
export function fmtNum(v: number | null | undefined, dash = "—"): string {
  return isNum(v) ? (v as number).toLocaleString("ko-KR") : dash;
}

/** 12,345 형태로 정수 반올림. */
export function fmtInt(v: number | null | undefined, dash = "—"): string {
  if (!isNum(v)) return dash;
  return Math.round(v as number).toLocaleString("ko-KR");
}

/** ₩1,234 형태. */
export function fmtKRW(v: number | null | undefined, dash = "—"): string {
  if (!isNum(v)) return dash;
  return "₩" + Math.round(v as number).toLocaleString("ko-KR");
}

/** +1.23% 형태. */
export function fmtPct(v: number | null | undefined, digits = 2, dash = "—"): string {
  if (!isNum(v)) return dash;
  const n = v as number;
  return (n >= 0 ? "+" : "") + n.toFixed(digits) + "%";
}

/** 큰 숫자: 1.2조 / 3,400억 / 1.2만. */
export function fmtBig(v: number | null | undefined, dash = "—"): string {
  if (!isNum(v)) return dash;
  const n = v as number;
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "조";
  if (n >= 1e8) return (n / 1e8).toFixed(0) + "억";
  if (n >= 1e4) return (n / 1e4).toFixed(0) + "만";
  return n.toLocaleString("ko-KR");
}

/** 안전한 숫자 변환 (NaN/undefined → 0). */
export function safeNum(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}
