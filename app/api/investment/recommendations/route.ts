/**
 * GET /api/investment/recommendations?topN=10
 * → 워치리스트 종목들의 일봉 분석 → 추천 종목 정렬
 *
 * 비용 0 — 100% 기술적 분석. 1시간 캐시.
 *
 * KIS 실패 시 OHLCV DB 캐시로 폴백 → 결과 안정성 확보.
 */
import { NextResponse } from "next/server";
import { getDailyOhlcv, type DailyCandle } from "@/lib/investment/kis-client";
import { rankRecommendations, scoreFromCandles } from "@/lib/investment/recommender";
import {
  getActiveWatchlist,
  getCachedRecommendations,
  saveRecommendations,
  pushRecommendationsToWatchlist,
  getOhlcvFromDB,
  saveOhlcvToDB,
} from "@/lib/investment/db";

export const dynamic = "force-dynamic";

/**
 * 일봉 가져오기 — 다중 단계 폴백:
 *   1) KIS 호출 (최대 1회 재시도)
 *   2) 성공 시 DB 캐시 갱신
 *   3) 실패 시 DB 캐시 사용 (있으면)
 */
async function fetchCandlesResilient(ticker: string, days: number): Promise<DailyCandle[]> {
  const tryFetch = async () => {
    const c = await getDailyOhlcv(ticker, days);
    return c;
  };
  // 1차
  try {
    const c = await tryFetch();
    if (c.length > 0) {
      // 캐시 저장 (백그라운드)
      saveOhlcvToDB(
        ticker,
        c.map((x) => ({
          date: x.date,
          open: x.open,
          high: x.high,
          low: x.low,
          close: x.close,
          volume: x.volume,
          tradingValue: x.tradingValue,
        }))
      ).catch(() => {});
      return c;
    }
  } catch {}

  // 2차 (200ms 후 재시도)
  await new Promise((r) => setTimeout(r, 250));
  try {
    const c = await tryFetch();
    if (c.length > 0) {
      saveOhlcvToDB(
        ticker,
        c.map((x) => ({
          date: x.date,
          open: x.open,
          high: x.high,
          low: x.low,
          close: x.close,
          volume: x.volume,
          tradingValue: x.tradingValue,
        }))
      ).catch(() => {});
      return c;
    }
  } catch {}

  // 3차: DB 캐시 폴백
  const cached = await getOhlcvFromDB(ticker, days);
  if (cached.length > 0) {
    return cached.map((c) => ({
      date: c.date,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      tradingValue: c.tradingValue,
    }));
  }
  return [];
}

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

  const watchlist = await getActiveWatchlist();
  if (!watchlist.length) {
    return NextResponse.json({
      items: [],
      error: "워치리스트가 비어있습니다. sql/investment_schema.sql 실행 후 시도하세요.",
    });
  }

  // 각 종목 일봉 → 점수
  const results: any[] = [];
  let kisFails = 0;
  let cacheUses = 0;
  for (const w of watchlist) {
    let candles: DailyCandle[] = [];
    try {
      candles = await fetchCandlesResilient(w.ticker, 90);
    } catch {
      kisFails++;
    }
    if (candles.length < 30) {
      kisFails++;
    } else {
      const score = scoreFromCandles(w.ticker, candles);
      if (score) {
        results.push({
          ...score,
          name: w.name,
          market: w.market,
          sector: w.sector,
        });
      }
    }
    // KIS 부하 분산
    await new Promise((res) => setTimeout(res, 80));
  }

  // 상위 N개 추천
  const top = rankRecommendations(results, topN).map((r, i) => ({
    ...r,
    rank: i + 1,
  }));

  // 결과가 너무 적으면 (KIS 거의 다 실패) → 옛 캐시로 폴백
  let finalItems: any[] = top;
  let source = "fresh";
  if (top.length < Math.min(5, topN)) {
    const cached = await getCachedRecommendations(120); // 2시간으로 확대
    if (cached.length > top.length) {
      finalItems = cached.map((r: any) => ({
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
      }));
      source = "fresh+fallback";
    }
  }

  // DB 저장 — 명시적으로 await + 에러 로깅
  if (top.length > 0) {
    try {
      await saveRecommendations(top);
    } catch (e) {
      console.error("[recommendations] saveRecommendations failed:", e);
    }
    pushRecommendationsToWatchlist(top).catch((e) =>
      console.error("[recommendations] pushRecommendationsToWatchlist failed:", e)
    );
  }

  return NextResponse.json({
    items: finalItems,
    source,
    generatedAt: new Date().toISOString(),
    debug: {
      watchlistSize: watchlist.length,
      analyzedCount: results.length,
      kisFails,
      cacheUses,
      freshCount: top.length,
    },
  });
}
