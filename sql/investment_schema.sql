-- ============================================================
-- 투자 페이지 — PostgreSQL (Neon) 스키마
-- ----------------------------------------------------------------
-- 실행: psql $DATABASE_URL -f sql/investment_schema.sql
--      또는 Neon Console SQL Editor에 통째로 붙여넣기
-- ============================================================

-- 1. 종목 마스터
CREATE TABLE IF NOT EXISTS investment_tickers (
    ticker VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    market VARCHAR(10) NOT NULL CHECK (market IN ('KOSPI', 'KOSDAQ', 'KONEX')),
    sector VARCHAR(50),
    is_etf BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_tickers_market ON investment_tickers(market);
CREATE INDEX IF NOT EXISTS idx_inv_tickers_active ON investment_tickers(is_active);


-- 2. 워치리스트 (사용자별 가능, 단일 글로벌도 가능)
CREATE TABLE IF NOT EXISTS investment_watchlist (
    id BIGSERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL REFERENCES investment_tickers(ticker),
    source VARCHAR(20) NOT NULL CHECK (source IN ('CORE', 'DYNAMIC', 'NEWS', 'MANUAL')),
    score REAL DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticker, source, valid_from)
);
CREATE INDEX IF NOT EXISTS idx_inv_wl_ticker ON investment_watchlist(ticker);
CREATE INDEX IF NOT EXISTS idx_inv_wl_valid ON investment_watchlist(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_inv_wl_source ON investment_watchlist(source);


-- 3. 일봉 OHLCV 캐시 (KIS 호출 줄이기)
CREATE TABLE IF NOT EXISTS investment_ohlcv_daily (
    ticker VARCHAR(10) NOT NULL REFERENCES investment_tickers(ticker),
    date DATE NOT NULL,
    open NUMERIC(15, 2),
    high NUMERIC(15, 2),
    low NUMERIC(15, 2),
    close NUMERIC(15, 2),
    volume BIGINT,
    trading_value BIGINT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (ticker, date)
);
CREATE INDEX IF NOT EXISTS idx_inv_ohlcv_date ON investment_ohlcv_daily(date);


-- 4. 추천 종목 결과 (1시간 TTL)
CREATE TABLE IF NOT EXISTS investment_recommendations (
    id BIGSERIAL PRIMARY KEY,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ticker VARCHAR(10) NOT NULL REFERENCES investment_tickers(ticker),
    rank INT NOT NULL,
    score REAL NOT NULL,                    -- -1.0 ~ +1.0
    confidence REAL NOT NULL,
    signal VARCHAR(10) NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD')),
    components JSONB,                       -- {ma: 0.3, rsi: 0.2, ...}
    rationale TEXT,
    current_price NUMERIC(15, 2),
    target_price NUMERIC(15, 2),
    stop_price NUMERIC(15, 2),
    expected_return REAL                    -- 예상 수익률 %
);
CREATE INDEX IF NOT EXISTS idx_inv_rec_generated ON investment_recommendations(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_rec_ticker ON investment_recommendations(ticker);


-- 5. 뉴스 캐시 (네이버 검색 결과 — 5분 TTL)
CREATE TABLE IF NOT EXISTS investment_news_cache (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    url_hash CHAR(64) NOT NULL UNIQUE,       -- SHA256
    title TEXT,
    summary TEXT,
    source VARCHAR(50),                       -- naver, dart 등
    published_at TIMESTAMPTZ,
    related_ticker VARCHAR(10),
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_news_published ON investment_news_cache(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_news_ticker ON investment_news_cache(related_ticker);


-- 6. 시세 스냅샷 캐시 (10초 TTL — KIS 호출량 절감)
CREATE TABLE IF NOT EXISTS investment_quote_cache (
    ticker VARCHAR(10) PRIMARY KEY REFERENCES investment_tickers(ticker),
    price NUMERIC(15, 2),
    prev_close NUMERIC(15, 2),
    change_rate REAL,
    open NUMERIC(15, 2),
    high NUMERIC(15, 2),
    low NUMERIC(15, 2),
    volume BIGINT,
    trading_value BIGINT,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);


-- 7. 시드 데이터: KOSPI 시총 상위 + KOSDAQ 핫 종목
INSERT INTO investment_tickers (ticker, name, market, sector) VALUES
('005930','삼성전자',          'KOSPI', '반도체'),
('000660','SK하이닉스',        'KOSPI', '반도체'),
('373220','LG에너지솔루션',    'KOSPI', '2차전지'),
('207940','삼성바이오로직스',  'KOSPI', '바이오'),
('005380','현대차',            'KOSPI', '자동차'),
('000270','기아',              'KOSPI', '자동차'),
('068270','셀트리온',          'KOSPI', '바이오'),
('035420','NAVER',             'KOSPI', '인터넷'),
('012330','현대모비스',        'KOSPI', '자동차부품'),
('006400','삼성SDI',           'KOSPI', '2차전지'),
('051910','LG화학',            'KOSPI', '화학'),
('035720','카카오',            'KOSPI', '인터넷'),
('105560','KB금융',            'KOSPI', '은행'),
('055550','신한지주',          'KOSPI', '은행'),
('086790','하나금융지주',      'KOSPI', '은행'),
('066570','LG전자',            'KOSPI', 'IT가전'),
('323410','카카오뱅크',        'KOSPI', '은행'),
('003670','포스코퓨처엠',      'KOSPI', '2차전지소재'),
('017670','SK텔레콤',          'KOSPI', '통신'),
('096770','SK이노베이션',      'KOSPI', '에너지'),
('015760','한국전력',          'KOSPI', '전력'),
('032830','삼성생명',          'KOSPI', '보험'),
('009150','삼성전기',          'KOSPI', '전자부품'),
('011200','HMM',               'KOSPI', '해운'),
('028260','삼성물산',          'KOSPI', '지주'),
('352820','하이브',            'KOSPI', '엔터테인먼트'),
-- KOSDAQ 핫
('247540','에코프로비엠',      'KOSDAQ', '2차전지소재'),
('086520','에코프로',          'KOSDAQ', '2차전지소재'),
('091990','셀트리온헬스케어',  'KOSDAQ', '바이오'),
('028300','HLB',               'KOSDAQ', '바이오'),
('196170','알테오젠',          'KOSDAQ', '바이오'),
('328130','루닛',              'KOSDAQ', '의료AI'),
('277810','레인보우로보틱스',  'KOSDAQ', '로봇'),
('042700','한미반도체',        'KOSDAQ', '반도체장비'),
('058470','리노공업',          'KOSDAQ', '반도체장비'),
('357780','솔브레인',          'KOSDAQ', '반도체소재'),
('112040','위메이드',          'KOSDAQ', '게임'),
('251270','넷마블',            'KOSDAQ', '게임'),
('122870','와이지엔터테인먼트','KOSDAQ', '엔터테인먼트'),
('035900','JYP Ent.',          'KOSDAQ', '엔터테인먼트'),
('041510','에스엠',            'KOSDAQ', '엔터테인먼트'),
('293490','카카오게임즈',      'KOSDAQ', '게임'),
('192820','코스맥스',          'KOSDAQ', '화장품'),
('214150','클래시스',          'KOSDAQ', '의료기기'),
-- ETF (저가 매매용)
('069500','KODEX 200',          'KOSPI', 'ETF'),
('229200','KODEX 코스닥150',    'KOSPI', 'ETF'),
('305720','KODEX 2차전지산업',  'KOSPI', 'ETF'),
('379780','KODEX 미국S&P500',   'KOSPI', 'ETF')
ON CONFLICT (ticker) DO UPDATE
    SET name = EXCLUDED.name, sector = EXCLUDED.sector;

-- ETF 플래그 표시
UPDATE investment_tickers SET is_etf = TRUE WHERE sector = 'ETF';


-- 8. 코어 워치리스트 (영구 — 항상 추적할 종목)
INSERT INTO investment_watchlist (ticker, source, score, valid_from, valid_until) VALUES
('005930','CORE', 100, NOW(), NULL),
('000660','CORE',  95, NOW(), NULL),
('373220','CORE',  90, NOW(), NULL),
('035720','CORE',  85, NOW(), NULL),
('035420','CORE',  80, NOW(), NULL),
('247540','CORE',  75, NOW(), NULL),
('086520','CORE',  70, NOW(), NULL),
('042700','CORE',  65, NOW(), NULL),
('068270','CORE',  60, NOW(), NULL),
('005380','CORE',  55, NOW(), NULL),
('069500','CORE',  50, NOW(), NULL),  -- ETF
('229200','CORE',  45, NOW(), NULL),  -- ETF
('305720','CORE',  40, NOW(), NULL)   -- ETF
ON CONFLICT (ticker, source, valid_from) DO NOTHING;


-- 확인
SELECT
  (SELECT COUNT(*) FROM investment_tickers) AS tickers,
  (SELECT COUNT(*) FROM investment_watchlist WHERE valid_until IS NULL OR valid_until > NOW()) AS active_watchlist;
