-- ============================================================
-- 누적된 추천/워치리스트 데이터 정리 (1회 실행)
-- ============================================================

-- 1) 가장 최신 generated_at 만 남기고 옛 추천 모두 삭제
DELETE FROM investment_recommendations
WHERE generated_at < (SELECT MAX(generated_at) FROM investment_recommendations);

-- 2) NEWS 소스 워치리스트 — ticker별 최신 1행만 남기고 나머지 만료
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY ticker, source
           ORDER BY valid_from DESC, id DESC
         ) AS rn
  FROM investment_watchlist
  WHERE source = 'NEWS'
)
DELETE FROM investment_watchlist
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3) 만료된 옛 NEWS 행 삭제
DELETE FROM investment_watchlist
WHERE source = 'NEWS'
  AND valid_until IS NOT NULL
  AND valid_until < NOW() - INTERVAL '1 day';

-- 확인
SELECT 'recommendations rows' AS what, COUNT(*) AS cnt
  FROM investment_recommendations
UNION ALL
SELECT 'watchlist NEWS rows', COUNT(*)
  FROM investment_watchlist WHERE source = 'NEWS'
UNION ALL
SELECT 'watchlist active', COUNT(*)
  FROM investment_watchlist
  WHERE valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until > NOW());
