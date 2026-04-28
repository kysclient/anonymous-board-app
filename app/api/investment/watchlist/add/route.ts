/**
 * POST /api/investment/watchlist/add
 * Body: { ticker: string, source?: 'MANUAL'|'NEWS', ttlHours?: number }
 * → 워치리스트 추가
 */
import { NextResponse } from "next/server";
import { addToWatchlist } from "@/lib/investment/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ticker = String(body?.ticker || "").trim();
    const source = (body?.source || "MANUAL") as "MANUAL" | "NEWS" | "DYNAMIC";
    const ttlHours =
      body?.ttlHours == null ? null : Number(body.ttlHours);

    if (!/^\d{6}$/.test(ticker)) {
      return NextResponse.json(
        { ok: false, error: "ticker는 6자리 숫자" },
        { status: 400 }
      );
    }

    const ok = await addToWatchlist(
      ticker,
      source,
      Number.isFinite(ttlHours as number) ? (ttlHours as number) : null
    );
    return NextResponse.json({ ok });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "add failed" },
      { status: 500 }
    );
  }
}
