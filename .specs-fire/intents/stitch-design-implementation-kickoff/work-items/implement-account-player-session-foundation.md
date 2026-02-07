---
id: implement-account-player-session-foundation
title: 계정/플레이어/세션 기반 상태 구현
intent: stitch-design-implementation-kickoff
complexity: high
mode: validate
status: completed
depends_on:
  - bootstrap-spacetimedb-module-and-seed
created: 2026-02-07T15:28:44Z
run_id: run-015
completed_at: 2026-02-07T15:50:52.362Z
---

# Work Item: 계정/플레이어/세션 기반 상태 구현

## Description

`DESIGN/05-data-model.md` 및 권한 설계에 맞춰 계정/세션/플레이어 상태의 기본 테이블 및 reducer 경로를 구현한다.

## Acceptance Criteria

- [ ] 계정 생성/연결 시 `account`, `session_state`, `player_state`의 일관된 초기화 규칙이 서버에서 보장된다.
- [ ] 인증/인가 실패 케이스가 명시적으로 거부되고 감사 가능한 로그 또는 이벤트가 남는다.
- [ ] 플레이어 초기 상태 조회가 구독 경로로 확인 가능하다.

## Technical Notes

- 보안/권한 변경 영향이 크므로 validate 모드 유지
- 인증 세부는 `DESIGN/DETAIL/stitch-authentication-authorization.md`와 정합성 확인

## Dependencies

- bootstrap-spacetimedb-module-and-seed
