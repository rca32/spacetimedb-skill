# 2026-02-22 Orillusion In-App Vendor Migration Log

## 변경 요약
- `stitch-orillusion-client/src/vendor/orillusion/`에 아래 스냅샷을 추가했다.
  - `core`, `geometry`, `particle`, `physics`, `stats`, `ammo`
- `stitch-orillusion-client/vite.config.ts`에 `@orillusion/*` alias를 추가했다.
- `stitch-orillusion-client/tsconfig.json`에 `paths` alias를 추가했다.
- `stitch-orillusion-client/package.json`에서 `@orillusion/*` 의존을 제거했다.

## 기술 메모
- `physics` 패키지의 런타임 의존을 위해 `@orillusion/ammo`를 벤더링 대상에 포함했다.
- 클라이언트 코드의 import 문자열(`@orillusion/core` 등)은 유지해 변경 범위를 줄였다.
- SpacetimeDB 네트워크 계층(`src/net`)은 구조 변경 없이 유지했다.

## 검증 체크
- [x] `bun install`
- [x] `bun run typecheck`
- [x] `bun run build`
- [ ] dev 실행 후 렌더/물리 기본 부팅 확인

## 후속 권장
- 벤더 코드 직접 수정 시 변경 파일/의도/회귀 테스트를 같은 로그 파일에 추가 기록한다.
- Orillusion 스냅샷 기준 버전(0.8.4 계열)에서 벗어나는 수동 패치가 생기면 별도 마이그레이션 노트를 작성한다.
