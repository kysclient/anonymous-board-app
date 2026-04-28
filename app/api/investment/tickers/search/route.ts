/**
 * GET /api/investment/tickers/search?q=...&limit=20
 * → 종목 마스터(investment_tickers)에서 이름/코드 LIKE 검색
 */
import { NextResponse } from "next/server";
import { searchTickers } from "@/lib/investment/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(50, Number(searchParams.get("limit") || "20"));
  if (q.length < 1) {
    return NextResponse.json({ items: [] });
  }
  try {
    const rows = await searchTickers(q, limit);
    return NextResponse.json({
      items: rows.map((r: any) => ({
        ticker: r.ticker,
        name: r.name,
        market: r.market,
        sector: r.sector,
        isEtf: !!r.is_etf,
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { items: [], error: e?.message || "search failed" },
      { status: 500 }
    );
  }
}
