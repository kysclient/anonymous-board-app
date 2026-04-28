/**
 * GET /api/investment/candles/{ticker}?days=100
 * → 일봉 OHLCV
 */
import { NextResponse } from "next/server";
import { getDailyOhlcv } from "@/lib/investment/kis-client";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(req.url);
  const days = Math.min(200, Number(searchParams.get("days") || "100"));

  if (!/^\d{6}$/.test(ticker)) {
    return NextResponse.json({ error: "invalid ticker" }, { status: 400 });
  }

  try {
    const candles = await getDailyOhlcv(ticker, days);
    return NextResponse.json({ ticker, candles });
  } catch (e: any) {
    return NextResponse.json(
      { ticker, candles: [], error: e?.message || "fetch failed" },
      { status: 502 }
    );
  }
}
