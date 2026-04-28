/**
 * GET /api/investment/orderbook/{ticker}
 * → 호가창 10단계
 */
import { NextResponse } from "next/server";
import { getOrderBook } from "@/lib/investment/kis-client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  if (!/^\d{6}$/.test(ticker)) {
    return NextResponse.json({ error: "invalid ticker" }, { status: 400 });
  }
  try {
    const ob = await getOrderBook(ticker);
    return NextResponse.json(ob);
  } catch (e: any) {
    return NextResponse.json(
      { ticker, current: 0, bids: [], asks: [], error: e?.message },
      { status: 502 }
    );
  }
}
