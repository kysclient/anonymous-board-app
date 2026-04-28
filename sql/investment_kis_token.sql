-- ============================================================
-- KIS 액세스 토큰 영구 캐시 (단일 row, id=1)
-- ----------------------------------------------------------------
-- 목적: KIS는 토큰 발급에 분당 1회 한도가 있는데
-- Next.js serverless 환경에선 in-memory 캐시가 사라져 자꾸 재발급 시도 →
-- 1분당 1회 한도 초과 (403 EGW00133).
-- 해결: 발급된 토큰을 Neon DB에 저장하고 모든 요청이 공유.
-- ============================================================

CREATE TABLE IF NOT EXISTS investment_kis_token (
  id           SMALLINT PRIMARY KEY DEFAULT 1,
  access_token TEXT NOT NULL,
  expires_at   BIGINT NOT NULL,        -- epoch ms
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CHECK (id = 1)                       -- 단일 row 강제
);

-- 확인
SELECT id, LEFT(access_token, 20) || '...' AS token_preview,
       to_timestamp(expires_at / 1000) AS expires_at_ts,
       updated_at
FROM investment_kis_token;
