# 온라인 오목 실행 설정

온라인 오목은 Vercel Functions의 WebSocket 업그레이드 API를 사용합니다.

## 로컬 실행

일반 `next dev`에서는 WebSocket 업그레이드가 주입되지 않으므로 Vercel 개발 서버로 실행합니다.

```bash
pnpm dlx vercel@latest dev
```

## 배포 환경

여러 서버 인스턴스에서 방 목록, 대국 상태, 채팅을 동일하게 유지하려면 Vercel 프로젝트에 Redis를 연결하고 아래 환경 변수를 등록합니다.

```bash
REDIS_URL=redis://default:password@host:port
```

`REDIS_URL`이 없으면 단일 서버 프로세스의 메모리 저장소로 동작합니다. 개발 미리보기에는 사용할 수 있지만, 실제 온라인 서비스에서는 Redis 연결이 필요합니다.

## 제공 기능

- 공개 방 목록 및 5초 자동 갱신
- 방 생성, 참가, 관전, 초대 링크 공유
- 서버 권한 착수 판정과 오목 승리 판정
- 자동 재접속, 재대국, 관전자, 실시간 채팅
- 데스크톱 및 모바일 반응형 UI
