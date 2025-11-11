-- 이상형 월드컵 기능을 위한 데이터베이스 스키마 업데이트

-- 1. gender_type ENUM 생성 (이미 생성했다면 에러 무시)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM ('남', '여', '기타');
    END IF;
END $$;

-- 2. users 테이블에 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS gender gender_type;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_last_ip ON users(last_ip);
CREATE INDEX IF NOT EXISTS idx_users_profile_image ON users(profile_image) WHERE profile_image IS NOT NULL;

-- 4. (선택사항) 월드컵 결과를 저장할 테이블 생성
CREATE TABLE IF NOT EXISTS worldcup_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  winner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worldcup_results_user_id ON worldcup_results(user_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_results_winner_id ON worldcup_results(winner_id);

-- 5. 이호준 솔로기원 운동 메시지 저장용 테이블 생성
CREATE TABLE IF NOT EXISTS hojun_solo_wishes (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL CHECK (char_length(message) <= 160),
  client_ip VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hojun_solo_wishes_created_at
  ON hojun_solo_wishes (created_at DESC);

-- 완료
SELECT 'Database schema updated successfully for 이상형 월드컵!' as message;
