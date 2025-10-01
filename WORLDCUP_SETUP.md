# 이상형 월드컵 설정 가이드

## 📋 개요
이 프로젝트에 이상형 월드컵 기능이 추가되었습니다. 사용자들이 프로필 이미지와 성별을 설정하고, 성별에 맞는 후보자들로 월드컵을 진행할 수 있습니다.

## 🗂️ 생성된 파일들

### 프론트엔드 페이지
- `/app/dashboard/worldcup/profile/page.tsx` - 프로필 설정 페이지 (이미지 업로드 + 성별 선택)
- `/app/dashboard/worldcup/page.tsx` - 이상형 월드컵 메인 페이지

### API 엔드포인트
- `/app/api/worldcup/profile/route.ts` - 사용자 프로필 조회/업데이트 API
- `/app/api/worldcup/candidates/route.ts` - 성별에 맞는 후보자 조회 API
- `/app/api/worldcup/result/route.ts` - 월드컵 결과 저장 API

### 데이터베이스
- `/database-update.sql` - 데이터베이스 스키마 업데이트 SQL 스크립트

## 🔧 설정 단계

### 1. 패키지 설치
```bash
npm install @vercel/blob --legacy-peer-deps
```

**참고**: npm 설치가 느릴 수 있습니다. 시간이 걸리면 `--legacy-peer-deps` 플래그를 사용하세요.

### 2. 데이터베이스 스키마 업데이트

NeonDB 콘솔에 접속하여 `database-update.sql` 파일의 내용을 실행하세요:

```sql
-- 1. gender_type ENUM 생성
CREATE TYPE gender_type AS ENUM ('남', '여', '기타');

-- 2. users 테이블에 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender gender_type;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_last_ip ON users(last_ip);
CREATE INDEX IF NOT EXISTS idx_users_profile_image ON users(profile_image) WHERE profile_image IS NOT NULL;

-- 4. 월드컵 결과 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS worldcup_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  winner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Vercel Blob Storage 설정

#### 3-1. Vercel 대시보드에서 Blob Storage 활성화
1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. 프로젝트 선택
3. **Storage** 탭으로 이동
4. **Blob** 선택 후 **Create** 클릭
5. Store 이름 입력 (예: `worldcup-images`)
6. 생성 완료

#### 3-2. 환경 변수 자동 추가 확인
Vercel Blob을 생성하면 다음 환경 변수들이 자동으로 추가됩니다:
- `BLOB_READ_WRITE_TOKEN`

`.env` 파일에 추가하세요 (로컬 개발용):
```bash
BLOB_READ_WRITE_TOKEN=your_token_here
```

**중요**: Vercel에 배포하면 자동으로 환경 변수가 설정되므로, 프로덕션에서는 별도 설정이 필요 없습니다.

### 4. 배포

#### Vercel에 배포
```bash
git add .
git commit -m "feat: 이상형 월드컵 기능 추가"
git push
```

Vercel이 자동으로 배포합니다.

## 🎮 사용 방법

### 사용자 관점

1. **프로필 설정**
   - `/dashboard/worldcup/profile` 페이지로 이동
   - 프로필 사진 업로드 (JPG, PNG, GIF, 최대 5MB)
   - 성별 선택 (남/여/기타)
   - "저장하고 시작하기" 클릭

2. **이상형 월드컵 플레이**
   - `/dashboard/worldcup` 페이지로 이동
   - 프로필이 설정되지 않았다면 자동으로 프로필 페이지로 리다이렉트
   - 16강 토너먼트 형식으로 진행
   - 각 라운드에서 두 후보 중 선택
   - 최종 우승자 확인

### 관리자 관점

- 사용자들이 프로필 이미지와 성별을 설정하면 자동으로 월드컵 후보자 풀에 추가됩니다
- 성별 필터링:
  - 남자 → 여자 후보만 표시
  - 여자 → 남자 후보만 표시
  - 기타 → 남자와 여자 모두 표시

## 🔍 기술 세부사항

### IP 기반 사용자 식별
- 사용자는 IP 주소로 식별됩니다 (`last_ip` 컬럼)
- 프로필 설정 시 IP가 자동으로 저장됩니다
- 같은 IP에서 접속하면 이전 설정을 불러옵니다

### 이미지 저장
- Vercel Blob Storage를 사용하여 이미지를 저장합니다
- 업로드된 이미지는 공개 URL로 저장됩니다
- 파일명 형식: `worldcup/{user_id}-{timestamp}.{extension}`

### 성별 기반 필터링
```typescript
// 남자 사용자
WHERE gender = '여' AND profile_image IS NOT NULL

// 여자 사용자
WHERE gender = '남' AND profile_image IS NOT NULL

// 기타 사용자
WHERE gender IN ('남', '여') AND profile_image IS NOT NULL
```

### 토너먼트 로직
- 최대 16명의 후보자를 랜덤하게 선택
- 16강 → 8강 → 4강 → 결승 순으로 진행
- 각 라운드에서 이긴 후보자가 다음 라운드로 진출

## 🚀 추가 개선 사항 (선택사항)

1. **결과 분석**
   - `worldcup_results` 테이블을 활용하여 인기 순위 집계
   - 통계 대시보드 추가

2. **소셜 기능**
   - 결과를 SNS로 공유하기
   - 친구와 비교하기

3. **다양한 토너먼트 형식**
   - 8강, 32강 등 다양한 형식 지원
   - 커스텀 라운드 설정

4. **프로필 편집**
   - 이미지 크롭 기능
   - 다중 이미지 업로드

## 🐛 트러블슈팅

### 이미지 업로드가 안 될 때
- Vercel Blob Storage가 제대로 설정되었는지 확인
- `BLOB_READ_WRITE_TOKEN` 환경 변수가 설정되었는지 확인
- 이미지 크기가 5MB 이하인지 확인

### 후보자가 나오지 않을 때
- 데이터베이스에 `gender`와 `profile_image`가 설정된 사용자가 있는지 확인
- 최소 2명 이상의 후보자가 필요합니다

### 프로필이 저장되지 않을 때
- NeonDB 연결 확인
- `gender_type` ENUM이 제대로 생성되었는지 확인
- 콘솔에서 에러 메시지 확인

## 📝 환경 변수 체크리스트

### 필수
- ✅ `DATABASE_URL` - NeonDB 연결 URL (이미 설정됨)
- ✅ `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage 토큰 (새로 필요)

### 선택
- `API_SECRET` - API 보안용 (이미 설정됨)

## 🎉 완료!

모든 설정이 완료되었습니다. `/dashboard/worldcup` 페이지로 이동하여 이상형 월드컵을 즐기세요!
