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
  // 최근 N분 안 가장 최신 배치(generated_at)만 반환 — 누적/중복 방지
  const rows = await sql`
    WITH latest AS (
      SELECT MAX(generated_at) AS gat
      FROM investment_recommendations
      WHERE generated_at > NOW() - (${maxAgeMin} || ' minutes')::interval
    )
    SELECT r.*, t.name AS ticker_name, t.market, t.sector
    FROM investment_recommendations r
    JOIN latest ON r.generated_at = latest.gat
    LEFT JOIN investment_tickers t ON t.ticker = r.ticker
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
 * 일봉 OHLCV 캐시 — KIS 호출 실패 시 폴백.
 */
export interface DailyCandleRow {
  date: string;          // YYYYMMDD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradingValue: number;
}

export async function getOhlcvFromDB(
  ticker: string,
  days = 100
): Promise<DailyCandleRow[]> {
  if (!sql) return [];
  try {
    const rows = await sql`
      SELECT date, open, high, low, close, volume, trading_value
      FROM investment_ohlcv_daily
      WHERE ticker = ${ticker}
      ORDER BY date DESC
      LIMIT ${days}
    `;
    return rows
      .map((r: any) => ({
        date: new Date(r.date).toISOString().slice(0, 10).replace(/-/g, ""),
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volume),
        tradingValue: Number(r.trading_value),
      }))
      .reverse();
  } catch {
    return [];
  }
}

export async function saveOhlcvToDB(
  ticker: string,
  candles: DailyCandleRow[]
) {
  if (!sql || !candles.length) return;
  for (const c of candles) {
    if (!c.date || c.date.length !== 8) continue;
    const dateStr = `${c.date.slice(0, 4)}-${c.date.slice(4, 6)}-${c.date.slice(6, 8)}`;
    try {
      await sql`
        INSERT INTO investment_ohlcv_daily
          (ticker, date, open, high, low, close, volume, trading_value, fetched_at)
        VALUES (
          ${ticker}, ${dateStr},
          ${c.open}, ${c.high}, ${c.low}, ${c.close},
          ${c.volume}, ${c.tradingValue}, NOW()
        )
        ON CONFLICT (ticker, date) DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume,
          trading_value = EXCLUDED.trading_value,
          fetched_at = NOW()
      `;
    } catch {
      // 한 행 실패해도 나머지 진행
    }
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
  // 7일 이상 된 옛 추천 정리 (DB 비대화 방지)
  try {
    await sql`
      DELETE FROM investment_recommendations
      WHERE generated_at < NOW() - INTERVAL '7 days'
    `;
  } catch {}
}

/**
 * 추천 종목을 NEWS 소스로 워치리스트에 추가.
 * 같은 ticker의 기존 NEWS 행은 즉시 만료시키고 새 row 1개만 유지.
 */
export async function pushRecommendationsToWatchlist(items: any[]) {
  if (!sql || !items.length) return;
  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const tickers = items.map((i) => i.ticker).filter(Boolean);
  if (!tickers.length) return;

  try {
    // 1) 같은 종목들의 기존 NEWS 행 즉시 만료
    await sql`
      UPDATE investment_watchlist
      SET valid_until = NOW()
      WHERE source = 'NEWS'
        AND ticker = ANY(${tickers})
        AND (valid_until IS NULL OR valid_until > NOW())
    `;
  } catch {}

  // 2) 새 NEWS row 추가
  for (const it of items) {
    try {
      await sql`
        INSERT INTO investment_watchlist (ticker, source, score, valid_from, valid_until)
        VALUES (${it.ticker}, 'NEWS', ${it.score || 0}, NOW(), ${validUntil})
        ON CONFLICT (ticker, source, valid_from) DO NOTHING
      `;
    } catch {}
  }

  // 3) 만료된 옛 NEWS 행 정리 (24h 지난 것)
  try {
    await sql`
      DELETE FROM investment_watchlist
      WHERE source = 'NEWS'
        AND valid_until IS NOT NULL
        AND valid_until < NOW() - INTERVAL '1 day'
    `;
  } catch {}
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
