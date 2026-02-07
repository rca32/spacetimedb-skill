---
id: migrate-auth-session-movement-foundation-into-domain-modules
title: 기존 인증/세션/이동 기반을 도메인 모듈로 이전
intent: stitch-full-game-server-development
complexity: high
mode: validate
status: pending
depends_on: [scaffold-domain-folder-structure-and-module-entrypoints]
created: 2026-02-07T16:08:40Z
---

# Work Item: 기존 인증/세션/이동 기반을 도메인 모듈로 이전

## Description

현재 `lib.rs`에 있는 account/session/transform/movement 로직을 `auth/`, `tables/`, `reducers/player/`, `validation/anti_cheat.rs`로 분리하고 공개 인터페이스를 정리한다.

## Acceptance Criteria

- [ ] account/session/transform/movement 관련 코드가 도메인 파일로 분리된다.
- [ ] 기존 동작(로그인/로그아웃/이동/위반 기록)이 회귀 없이 유지된다.
- [ ] 모듈 분리 후에도 CLI 검증 시나리오가 통과한다.

## Technical Notes

- 기준 문서: `DESIGN/04-server-architecture.md`, `DESIGN/06-sync-anti-cheat.md`
- 리팩터링 단계에서 동작 동등성 유지

## Dependencies

- scaffold-domain-folder-structure-and-module-entrypoints
