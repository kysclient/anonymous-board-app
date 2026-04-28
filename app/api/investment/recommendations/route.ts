/**
 * GET /api/investment/recommendations?topN=10
 * → 워치리스트 종목들의 일봉 분석 → BUY 추천 상위 N개
 *
 * LLM 사용 X — 100% 기술적 분석.
 * 결과 1시간 캐시.
 */
import { NextResponse } from "next/server";
import { getDailyOhlcv } from "@/lib/investment/kis-client";
import { rankRecommendations, scoreFromCandles } from "@/lib/investment/recommender";
import {
  getActiveWatchlist,
  getCachedRecommendations,
  saveRecommendations,
  pushRecommendationsToWatchlist,
} from "@/lib/investment/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topN = Math.min(20, Number(searchParams.get("topN") || "10"));
  const useCache = searchParams.get("cache") !== "false";

  // 캐시 (1시간)
  if (useCache) {
    const cached = await getCachedRecommendations(60);
    if (cached.length > 0) {
      return NextResponse.json({
        items: cached.map((r: any) => ({
          ticker: r.ticker,
          name: r.ticker_name || undefined,
          market: r.market,
          sector: r.sector,
          rank: r.rank,
          score: Number(r.score),
          confidence: Number(r.confidence),
          signal: r.signal,
          components: r.components,
          rationale: r.rationale,
          currentPrice: Number(r.current_price),
          targetPrice: Number(r.target_price),
          stopPrice: Number(r.stop_price),
          expectedReturn: Number(r.expected_return),
        })),
        source: "cache",
        generatedAt: cached[0].generated_at,
      });
    }
  }

  // 워치리스트 가져오기
  const watchlist = await getActiveWatchlist();
  if (!watchlist.length) {
    return NextResponse.json({
      items: [],
      error: "워치리스트가 비어있습니다. sql/investment_schema.sql 실행 후 시도하세요.",
    });
  }

  // 각 종목 일봉 → 점수 산출 (병렬, 부하 분산 위해 50ms 간격)
  const results: any[] = [];
  for (const w of watchlist) {
    try {
      const candles = await getDailyOhlcv(w.ticker, 90);
      if (candles.length < 30) continue;
      const score = scoreFromCandles(w.ticker, candles);
      if (score) {
        results.push({ ...score, name: w.name, market: w.market, sector: w.sector });
      }
    } catch (e) {
      // 일부 실패는 무시
    }
    await new Promise((res) => setTimeout(res, 50));
  }

  // 상위 N개 BUY 추천
  const top = rankRecommendations(results, topN).map((r, i) => ({
    ...r,
    rank: i + 1,
  }));

  // DB 저장 (백그라운드)
  saveRecommendations(top).catch(() => {});
  // 추천 상위 → NEWS 워치리스트로 24h 자동 편입 (실시간 추천 종목 추가 효과)
  pushRecommendationsToWatchlist(top).catch(() => {});

  return NextResponse.json({
    items: top,
    allScores: results,           // 전체 점수 (BUY 외 포함)
    source: "fresh",
    generatedAt: new Date().toISOString(),
  });
}
