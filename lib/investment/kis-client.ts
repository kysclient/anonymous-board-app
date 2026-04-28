/**
 * KIS Open API 클라이언트 (TypeScript)
 *
 * - 시세 / 일봉 / 호가 / 지수 / 잔고
 * - OAuth 토큰 메모리 캐시 (24h)
 * - LIVE 환경만 지원 (paper는 `KIS_BASE_URL` 직접 변경)
 */

import { getKisTokenFromDB, saveKisTokenToDB } from "./db";

const KIS_BASE_URL =
  process.env.KIS_BASE_URL || "https://openapi.koreainvestment.com:9443";
const APP_KEY = process.env.KIS_APP_KEY || "";
const APP_SECRET = process.env.KIS_APP_SECRET || "";
const ACCOUNT = process.env.KIS_ACCOUNT || ""; // "12345678-01"

// L1: 메모리 캐시 (같은 Node 프로세스 내)
let memCache: { value: string; expiresAt: number } | null = null;
// 동시 요청 중복 방지 (서로 같은 fetch 공유)
let pendingTokenPromise: Promise<string> | null = null;
// 1분당 1회 한도 — 직전 발급 시각
let lastIssueAttempt = 0;
// 마지막 403 발생 시각 — 백오프
let last403At = 0;
const RATE_LIMIT_BACKOFF_MS = 60_000;

function safeNumber(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function issueNewToken(): Promise<string> {
  // KIS 한도: 분당 1회. 직전 시도가 60초 이내면 거부
  const since = Date.now() - lastIssueAttempt;
  if (since < 60_000) {
    throw new Error(
      `KIS 토큰 발급 분당 1회 한도. ${Math.ceil(
        (60_000 - since) / 1000
      )}초 후 재시도하세요`
    );
  }
  lastIssueAttempt = Date.now();

  const r = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: APP_KEY,
      appsecret: APP_SECRET,
    }),
  });
  if (!r.ok) {
    if (r.status === 403) last403At = Date.now();
    throw new Error(`KIS 토큰 발급 실패: ${r.status} ${await r.text()}`);
  }
  const data = await r.json();
  const expiresIn = Number(data.expires_in || 86400);
  const expiresAt = Date.now() + (expiresIn - 60) * 1000;
  memCache = { value: data.access_token, expiresAt };
  // DB 영구 캐시 저장 (다른 인스턴스/요청도 공유)
  saveKisTokenToDB(data.access_token, expiresAt).catch(() => {});
  return data.access_token;
}

async function getAccessToken(): Promise<string> {
  if (!APP_KEY || !APP_SECRET) {
    throw new Error("KIS_APP_KEY/KIS_APP_SECRET 환경변수가 비어있습니다");
  }

  // L1: 메모리
  if (memCache && Date.now() < memCache.expiresAt) {
    return memCache.value;
  }

  // 진행 중인 fetch가 있으면 그걸 공유 (동시요청 dedup)
  if (pendingTokenPromise) return pendingTokenPromise;

  pendingTokenPromise = (async () => {
    try {
      // L2: DB
      const dbToken = await getKisTokenFromDB();
      if (dbToken) {
        memCache = { value: dbToken.token, expiresAt: dbToken.expiresAt };
        return dbToken.token;
      }
      // 403 백오프 — 최근 1분 내 403 받았으면 즉시 시도 안 함
      if (Date.now() - last403At < RATE_LIMIT_BACKOFF_MS) {
        const waitSec = Math.ceil(
          (RATE_LIMIT_BACKOFF_MS - (Date.now() - last403At)) / 1000
        );
        throw new Error(
          `KIS 분당 토큰 한도. ${waitSec}초 후 자동 재시도됩니다`
        );
      }
      // L3: 새로 발급
      return await issueNewToken();
    } finally {
      pendingTokenPromise = null;
    }
  })();

  return pendingTokenPromise;
}

async function commonHeaders(trId: string): Promise<HeadersInit> {
  const token = await getAccessToken();
  return {
    "content-type": "application/json; charset=utf-8",
    authorization: `Bearer ${token}`,
    appkey: APP_KEY,
    appsecret: APP_SECRET,
    tr_id: trId,
  };
}

// ============ 타입 ============

export interface Quote {
  ticker: string;
  name: string;
  price: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  changeRate: number;
  volume: number;
  tradingValue: number;
}

export interface DailyCandle {
  date: string;     // YYYYMMDD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradingValue: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBook {
  ticker: string;
  current: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface IndexQuote {
  code: string;     // "0001"=KOSPI, "1001"=KOSDAQ
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

export interface HoldingItem {
  ticker: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  pnlPct: number;
}

export interface AccountBalance {
  cash: number;
  holdingsValue: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  holdings: HoldingItem[];
}

// ============ 시세 ============

export async function getCurrentPrice(ticker: string): Promise<Quote> {
  const headers = await commonHeaders("FHKST01010100");
  const url = new URL(`${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  url.searchParams.set("FID_INPUT_ISCD", ticker);

  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`KIS 시세 ${ticker}: ${r.status}`);
  const data = await r.json();
  if (data.rt_cd !== "0") throw new Error(`KIS 시세 오류: ${data.msg1}`);
  const o = data.output;
  return {
    ticker,
    name: o.hts_kor_isnm || "",
    price: safeNumber(o.stck_prpr),
    prevClose: safeNumber(o.stck_sdpr),
    open: safeNumber(o.stck_oprc),
    high: safeNumber(o.stck_hgpr),
    low: safeNumber(o.stck_lwpr),
    changeRate: safeNumber(o.prdy_ctrt),
    volume: safeNumber(o.acml_vol),
    tradingValue: safeNumber(o.acml_tr_pbmn),
  };
}

// ============ 일봉 ============

export async function getDailyOhlcv(
  ticker: string,
  days: number = 100
): Promise<DailyCandle[]> {
  const headers = await commonHeaders("FHKST03010100");
  const url = new URL(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice`
  );
  const end = new Date();
  const start = new Date(end.getTime() - days * 1.6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  url.searchParams.set("FID_INPUT_ISCD", ticker);
  url.searchParams.set("FID_INPUT_DATE_1", fmt(start));
  url.searchParams.set("FID_INPUT_DATE_2", fmt(end));
  url.searchParams.set("FID_PERIOD_DIV_CODE", "D");
  url.searchParams.set("FID_ORG_ADJ_PRC", "0");

  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`KIS 일봉 ${ticker}: ${r.status}`);
  const data = await r.json();
  if (data.rt_cd !== "0") throw new Error(`KIS 일봉 오류: ${data.msg1}`);

  const candles: DailyCandle[] = (data.output2 || [])
    .filter((row: any) => row?.stck_bsop_date)
    .map((row: any) => ({
      date: row.stck_bsop_date,
      open: safeNumber(row.stck_oprc),
      high: safeNumber(row.stck_hgpr),
      low: safeNumber(row.stck_lwpr),
      close: safeNumber(row.stck_clpr),
      volume: safeNumber(row.acml_vol),
      tradingValue: safeNumber(row.acml_tr_pbmn),
    }))
    .reverse(); // 과거 → 최신
  return candles.slice(-days);
}

// ============ 호가 ============

export async function getOrderBook(ticker: string): Promise<OrderBook> {
  const headers = await commonHeaders("FHKST01010200");
  const url = new URL(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn`
  );
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
  url.searchParams.set("FID_INPUT_ISCD", ticker);

  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`KIS 호가 ${ticker}: ${r.status}`);
  const data = await r.json();
  if (data.rt_cd !== "0") throw new Error(`KIS 호가 오류: ${data.msg1}`);

  const out1 = data.output1 || {};
  const out2 = data.output2 || {};
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  for (let i = 1; i <= 10; i++) {
    const ap = safeNumber(out1[`askp${i}`]);
    const aq = safeNumber(out1[`askp_rsqn${i}`]);
    const bp = safeNumber(out1[`bidp${i}`]);
    const bq = safeNumber(out1[`bidp_rsqn${i}`]);
    if (ap > 0) asks.push({ price: ap, quantity: aq });
    if (bp > 0) bids.push({ price: bp, quantity: bq });
  }
  return {
    ticker,
    current: safeNumber(out2.stck_prpr),
    bids,
    asks,
  };
}

// ============ 지수 ============

export async function getIndex(code: string): Promise<IndexQuote> {
  const headers = await commonHeaders("FHPUP02100000");
  const url = new URL(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-index-price`
  );
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", "U");
  url.searchParams.set("FID_INPUT_ISCD", code);

  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`KIS 지수 ${code}: ${r.status}`);
  const data = await r.json();
  if (data.rt_cd !== "0") throw new Error(`KIS 지수 오류: ${data.msg1}`);
  const o = data.output;
  return {
    code,
    name: o.hts_kor_isnm || o.bstp_kor_isnm || "",
    value: safeNumber(o.bstp_nmix_prpr),
    change: safeNumber(o.bstp_nmix_prdy_vrss),
    changeRate: safeNumber(o.prdy_ctrt),
  };
}

// ============ 잔고 (선택) ============

export async function getBalance(): Promise<AccountBalance> {
  if (!ACCOUNT) throw new Error("KIS_ACCOUNT 미설정");
  const [cano, prdt = "01"] = ACCOUNT.split("-");
  const headers = await commonHeaders("TTTC8434R");
  const url = new URL(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/trading/inquire-balance`
  );
  url.searchParams.set("CANO", cano);
  url.searchParams.set("ACNT_PRDT_CD", prdt);
  url.searchParams.set("AFHR_FLPR_YN", "N");
  url.searchParams.set("OFL_YN", "");
  url.searchParams.set("INQR_DVSN", "02");
  url.searchParams.set("UNPR_DVSN", "01");
  url.searchParams.set("FUND_STTL_ICLD_YN", "N");
  url.searchParams.set("FNCG_AMT_AUTO_RDPT_YN", "N");
  url.searchParams.set("PRCS_DVSN", "01");
  url.searchParams.set("CTX_AREA_FK100", "");
  url.searchParams.set("CTX_AREA_NK100", "");

  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`KIS 잔고: ${r.status}`);
  const data = await r.json();
  if (data.rt_cd !== "0") throw new Error(`KIS 잔고 오류: ${data.msg1}`);

  const holdings: HoldingItem[] = (data.output1 || [])
    .filter((row: any) => safeNumber(row.hldg_qty) > 0)
    .map((row: any) => ({
      ticker: row.pdno || "",
      name: row.prdt_name || "",
      quantity: safeNumber(row.hldg_qty),
      avgPrice: safeNumber(row.pchs_avg_pric),
      currentPrice: safeNumber(row.prpr),
      marketValue: safeNumber(row.evlu_amt),
      unrealizedPnl: safeNumber(row.evlu_pfls_amt),
      pnlPct: safeNumber(row.evlu_pfls_rt),
    }));
  const out2 = (data.output2 && data.output2[0]) || {};
  const total = safeNumber(out2.tot_evlu_amt);
  const totalPnl = safeNumber(out2.evlu_pfls_smtl_amt);
  const cost = total > totalPnl ? total - totalPnl : 1;

  return {
    cash: safeNumber(out2.dnca_tot_amt),
    holdingsValue: safeNumber(out2.scts_evlu_amt),
    totalValue: total,
    totalPnl,
    totalPnlPct: cost > 0 ? (totalPnl / cost) * 100 : 0,
    holdings,
  };
}
