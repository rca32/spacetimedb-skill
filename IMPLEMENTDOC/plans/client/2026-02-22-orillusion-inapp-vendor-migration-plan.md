# 2026-02-22 Orillusion In-App Vendor Migration Plan

## 목적
- `stitch-orillusion-client`에서 `@orillusion/*` 외부 패키지 의존을 제거한다.
- 클라이언트 내부 벤더 스냅샷으로 엔진 수정 가능성을 확보한다.
- SpacetimeDB 네트워크/구독/리듀서 경로는 동작 유지한다.

## 범위
- 벤더 대상: `core`, `geometry`, `particle`, `physics`, `stats` (추가 의존 `ammo` 포함)
- Vite/TypeScript alias를 내부 벤더 경로로 고정
- `package.json`에서 `@orillusion/*` 직접 의존 제거

## 비범위
- Orillusion 업스트림 자동 동기화 체계 구축
- 렌더 품질/성능 튜닝 재설계
- SpacetimeDB 스키마/리듀서 계약 변경

## 구현 단계
1. `stitch-orillusion-client/src/vendor/orillusion/`에 패키지 스냅샷 복사
2. `vite.config.ts` `resolve.alias`를 벤더 경로로 설정
3. `tsconfig.json` `compilerOptions.paths`를 벤더 경로로 설정
4. `package.json`에서 `@orillusion/*` 의존 제거
5. `bun install`, `bun run typecheck`, `bun run build`로 검증

## 리스크 및 대응
- 리스크: `physics` 내부의 `@orillusion/ammo` 참조 누락
- 대응: `ammo`까지 벤더링 및 alias에 포함

## 수용 기준
- 타입체크/빌드 성공
- 런타임 import가 내부 벤더 경로로 해상
- SpacetimeDB 연결/재연결 코드에 기능 변경 없음
