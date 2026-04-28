/**
 * GET /api/investment/watchlist
 * → 활성 워치리스트
 */
import { NextResponse } from "next/server";
import { getActiveWatchlist } from "@/lib/investment/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getActiveWatchlist();
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message }, { status: 500 });
  }
}
