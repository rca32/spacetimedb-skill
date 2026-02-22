# 2026-02-22 Internal Engine Source Integration Plan

## 목적
- `stitch-orillusion-client`에서 외부/벤더 패키지 의존을 제거하고 내부 엔진 소스로 직접 통합한다.
- 클라이언트 import 규약을 `@engine/*`로 통일해 장기 유지보수 기준을 명확히 한다.

## 범위
- 내부 엔진 루트: `stitch-orillusion-client/engines/orillusion-src`
- 통합 대상:
  - core source: `src`
  - plugins: `packages/geometry`, `packages/particle`, `packages/physics`, `packages/stats`, `packages/graphic`
  - runtime deps: `packages/ammo`, `packages/wasm-matrix`
- 빌드/타입 alias를 `@engine/*`로 전환
- 기존 `src/vendor/orillusion` 즉시 제거

## 구현 절차
1. 엔진 소스 편입 및 엔트리포인트(`core|geometry|particle|physics|stats|graphic|ammo|wasm-matrix`) 구성
2. 앱/엔진 import를 `@engine/*`로 치환
3. `vite.config.ts`, `tsconfig.json` alias 전환
4. 기존 vendor 제거 및 `.gitignore` 정리
5. `bun run typecheck`, `bun run build` 검증

## 수용 기준
- 클라이언트 소스에서 `@orillusion/*` import가 0건
- 타입체크/빌드 성공
- 런타임 엔진 초기화, physics/stats/geometry/particle 연동 정상
