/**
 * 투자 페이지 DB 헬퍼 (Neon serverless).
 *
 * 기존 lib/db.ts 의 sql 클라이언트를 재사용.
 */

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL/POSTGRES_URL 미설정 — 투자 DB 기능 비활성");
}
export const sql = databaseUrl ? neon(databaseUrl) : null;

export interface WatchlistRow {
  ticker: string;
  name: string;
  market: string;
  sector: string | null;
  source: string;
  score: number;
  valid_until: string | null;
}

export async function getActiveWatchlist(): Promise<WatchlistRow[]> {
  if (!sql) return [];
  const rows = await sql`
    SELECT DISTINCT ON (w.ticker)
      w.ticker, t.name, t.market, t.sector,
      w.source, w.score, w.valid_until
    FROM investment_watchlist w
    JOIN investment_tickers t ON t.ticker = w.ticker
    WHERE t.is_active = TRUE
      AND w.valid_from <= NOW()
      AND (w.valid_until IS NULL OR w.valid_until > NOW())
    ORDER BY w.ticker, w.score DESC
  `;
  return rows as WatchlistRow[];
}

export async function getActiveTickers(): Promise<string[]> {
  const rows = await getActiveWatchlist();
  return rows.map((r) => r.ticker);
}

export async function getCachedRecommendations(maxAgeMin = 60) {
  if (!sql) return [];
  const rows = await sql`
    SELECT r.*, t.name AS ticker_name, t.market, t.sector
    FROM investment_recommendations r
    LEFT JOIN investment_tickers t ON t.ticker = r.ticker
    WHERE r.generated_at > NOW() - (${maxAgeMin} || ' minutes')::interval
    ORDER BY r.rank ASC
  `;
  return rows;
}

/**
 * 종목 마스터 검색 (이름/코드).
 * is_active=1 이면 활성 종목만.
 */
export async function searchTickers(q: string, limit = 20) {
  if (!sql) return [];
  const like = `%${q}%`;
  const rows = await sql`
    SELECT ticker, name, market, sector, is_etf
    FROM investment_tickers
    WHERE is_active = TRUE
      AND (name ILIKE ${like} OR ticker ILIKE ${like})
    ORDER BY
      CASE WHEN ticker = ${q} THEN 0
           WHEN name = ${q} THEN 1
           WHEN ticker ILIKE ${q + "%"} THEN 2
           WHEN name ILIKE ${q + "%"} THEN 3
           ELSE 4
      END,
      ticker
    LIMIT ${limit}
  `;
  return rows;
}

/**
 * KIS 토큰 영구 캐시 — 분당 1회 한도 회피용.
 * 모든 Next.js 인스턴스/요청이 이 캐시를 공유.
 */
export async function getKisTokenFromDB(): Promise<{
  token: string;
  expiresAt: number;
} | null> {
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT access_token, expires_at FROM investment_kis_token WHERE id = 1
    `;
    if (rows.length === 0) return null;
    const r: any = rows[0];
    const expiresAt = Number(r.expires_at);
    // 만료 60초 전엔 무효 처리
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt - 60_000) {
      return null;
    }
    return { token: r.access_token, expiresAt };
  } catch {
    return null;
  }
}

export async function saveKisTokenToDB(
  token: string,
  expiresAt: number
): Promise<void> {
  if (!sql) return;
  try {
    await sql`
      INSERT INTO investment_kis_token (id, access_token, expires_at, updated_at)
      VALUES (1, ${token}, ${expiresAt}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    `;
  } catch {
    // 무시
  }
}

/**
 * 단일 종목을 워치리스트에 추가 (UPSERT).
 */
export async function addToWatchlist(
  ticker: string,
  source: "MANUAL" | "NEWS" | "DYNAMIC" = "MANUAL",
  ttlHours: number | null = null
) {
  if (!sql) return false;
  const validUntil = ttlHours
    ? new Date(Date.now() + ttlHours * 3600_000).toISOString()
    : null;
  try {
    await sql`
      INSERT INTO investment_watchlist (ticker, source, score, valid_from, valid_until)
      VALUES (${ticker}, ${source}, 60, NOW(), ${validUntil})
      ON CONFLICT (ticker, source, valid_from) DO NOTHING
    `;
    return true;
  } catch {
    return false;
  }
}

export async function saveRecommendations(items: any[]) {
  if (!sql || !items.length) return;
  const generatedAt = new Date().toISOString();
  for (const it of items) {
    await sql`
      INSERT INTO investment_recommendations
        (generated_at, ticker, rank, score, confidence, signal, components, rationale,
         current_price, target_price, stop_price, expected_return)
      VALUES (
        ${generatedAt}, ${it.ticker}, ${it.rank}, ${it.score}, ${it.confidence},
        ${it.signal}, ${JSON.stringify(it.components)}, ${it.rationale},
        ${it.currentPrice}, ${it.targetPrice}, ${it.stopPrice}, ${it.expectedReturn}
      )
    `;
  }
}

/**
 * 추천 종목을 24h NEWS 소스로 워치리스트에 추가.
 * 이미 CORE에 있으면 중복 추가 안 함.
 */
export async function pushRecommendationsToWatchlist(items: any[]) {
  if (!sql || !items.length) return;
  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  for (const it of items) {
    try {
      await sql`
        INSERT INTO investment_watchlist (ticker, source, score, valid_from, valid_until)
        VALUES (${it.ticker}, 'NEWS', ${it.score || 0}, NOW(), ${validUntil})
        ON CONFLICT (ticker, source, valid_from) DO NOTHING
      `;
    } catch {
      // 중복 등 무시
    }
  }
}

export async function getCachedQuote(ticker: string, maxAgeSec = 10) {
  if (!sql) return null;
  const rows = await sql`
    SELECT *
    FROM investment_quote_cache
    WHERE ticker = ${ticker}
      AND fetched_at > NOW() - (${maxAgeSec} || ' seconds')::interval
  `;
  return rows[0] || null;
}

export async function upsertQuoteCache(q: any) {
  if (!sql) return;
  await sql`
    INSERT INTO investment_quote_cache
      (ticker, price, prev_close, change_rate, open, high, low, volume, trading_value, fetched_at)
    VALUES (
      ${q.ticker}, ${q.price}, ${q.prevClose}, ${q.changeRate},
      ${q.open}, ${q.high}, ${q.low}, ${q.volume}, ${q.tradingValue}, NOW()
    )
    ON CONFLICT (ticker) DO UPDATE SET
      price = EXCLUDED.price,
      prev_close = EXCLUDED.prev_close,
      change_rate = EXCLUDED.change_rate,
      open = EXCLUDED.open,
      high = EXCLUDED.high,
      low = EXCLUDED.low,
      volume = EXCLUDED.volume,
      trading_value = EXCLUDED.trading_value,
      fetched_at = NOW()
  `;
}
