/**
 * GET /api/investment/quotes?tickers=005930,000660,...
 * → 종목들의 실시간 시세 (10초 캐시)
 */
import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/investment/kis-client";
import { getCachedQuote, upsertQuoteCache } from "@/lib/investment/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tickers = (searchParams.get("tickers") || "")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => /^\d{6}$/.test(t));

  if (!tickers.length) {
    return NextResponse.json({ items: [] });
  }

  const results = await Promise.all(
    tickers.map(async (ticker) => {
      // 1) 캐시 우선
      const cached = await getCachedQuote(ticker, 10);
      if (cached) {
        return {
          ticker,
          name: cached.name || "",
          price: Number(cached.price),
          prevClose: Number(cached.prev_close),
          changeRate: Number(cached.change_rate),
          open: Number(cached.open),
          high: Number(cached.high),
          low: Number(cached.low),
          volume: Number(cached.volume),
          tradingValue: Number(cached.trading_value),
          source: "cache",
        };
      }
      // 2) KIS 호출
      try {
        const q = await getCurrentPrice(ticker);
        await upsertQuoteCache(q).catch(() => {});
        return { ...q, source: "kis" };
      } catch (e: any) {
        return { ticker, error: e?.message || "fetch failed" };
      }
    })
  );

  return NextResponse.json({ items: results });
}
