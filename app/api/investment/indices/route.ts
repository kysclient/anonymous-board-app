/**
 * GET /api/investment/indices
 * → KOSPI / KOSDAQ / USD-KRW
 *
 * - KOSPI/KOSDAQ : KIS 업종지수 API (FHPUP02100000)
 * - USD/KRW      : Frankfurter.app (무료, 키 불필요)
 */
import { NextResponse } from "next/server";
import { getIndex } from "@/lib/investment/kis-client";

export const dynamic = "force-dynamic";

async function fetchUsdKrw(): Promise<{
  value: number;
  change: number;
  changeRate: number;
} | null> {
  try {
    // 오늘 환율
    const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=KRW", {
      cache: "no-store",
    });
    if (!r.ok) return null;
    const d = await r.json();
    const todayRate = d?.rates?.KRW;
    if (typeof todayRate !== "number") return null;

    // 어제(영업일) 환율 (변동률 계산용)
    let prev = todayRate;
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const ry = await fetch(
        `https://api.frankfurter.app/${yesterday}?from=USD&to=KRW`,
        { cache: "no-store" }
      );
      if (ry.ok) {
        const dy = await ry.json();
        if (typeof dy?.rates?.KRW === "number") prev = dy.rates.KRW;
      }
    } catch {}

    const change = todayRate - prev;
    const changeRate = prev > 0 ? (change / prev) * 100 : 0;
    return {
      value: Math.round(todayRate * 100) / 100,
      change: Math.round(change * 100) / 100,
      changeRate: Math.round(changeRate * 100) / 100,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const indexCodes: Array<["KOSPI" | "KOSDAQ", string]> = [
    ["KOSPI", "0001"],
    ["KOSDAQ", "1001"],
  ];

  const [kospi, kosdaq, usdkrw] = await Promise.all([
    getIndex(indexCodes[0][1])
      .then((i) => ({ ...i, name: "KOSPI" as const }))
      .catch((e: any) => ({
        name: "KOSPI" as const,
        code: indexCodes[0][1],
        value: 0,
        change: 0,
        changeRate: 0,
        error: e?.message,
      })),
    getIndex(indexCodes[1][1])
      .then((i) => ({ ...i, name: "KOSDAQ" as const }))
      .catch((e: any) => ({
        name: "KOSDAQ" as const,
        code: indexCodes[1][1],
        value: 0,
        change: 0,
        changeRate: 0,
        error: e?.message,
      })),
    fetchUsdKrw(),
  ]);

  const items: any[] = [kospi, kosdaq];
  if (usdkrw) {
    items.push({
      name: "USD/KRW",
      code: "USDKRW",
      ...usdkrw,
    });
  }

  return NextResponse.json({ items });
}
