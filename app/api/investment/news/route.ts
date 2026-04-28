/**
 * GET /api/investment/news?q=삼성전자&display=10
 * → 네이버 뉴스 (LLM 분석 없음, 표시 전용)
 */
import { NextResponse } from "next/server";
import { searchNews } from "@/lib/investment/naver-news";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "코스피";
  const display = Math.min(30, Number(searchParams.get("display") || "10"));
  try {
    const items = await searchNews(q, display);
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message }, { status: 502 });
  }
}
