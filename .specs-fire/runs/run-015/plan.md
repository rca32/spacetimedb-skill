---
run: run-015
work_item: implement-account-player-session-foundation
intent: stitch-design-implementation-kickoff
mode: validate
checkpoint: validate-plan
approved_at: null
---

# Implementation Plan: 계정/플레이어/세션 기반 상태 구현

## Approach

Checkpoint 1에서 승인된 설계를 기준으로 `stitch-server` 모듈에 `account`/`session_state`를 추가하고,
`account_bootstrap`/`sign_in`/`sign_out` reducer로 계정-세션 초기화 경로를 구현한다.
기존 `player_state`를 sign-in 경로에서 멱등 보장해 접속 직후 조회 일관성을 만든다.

## Files to Create

| File | Purpose |
|------|---------|
| (none) | |

## Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/lib.rs` | account/session_state 테이블 및 인증/세션 reducer 추가, 권한 실패 거부/로그 경로 반영 |
| `stitch-server/README.md` | sign-in/sign-out 검증 절차와 SQL 확인 명령 추가 |

## Tests

| Test File | Coverage |
|-----------|----------|
| (integration) CLI commands | `spacetime build/publish/call/sql`로 account/session/player_state 상태 전이 검증 |

## Technical Details

- `session_state`는 private table로 선언해 노출을 차단
- `sign_in`은 account 존재/차단 훅 검증 후 session row를 upsert
- `sign_out`은 caller identity 소유 세션만 삭제 허용
- `client_connected`는 `player_state` 최소 보장을 유지하되 계정 생성 로직 중복을 피하도록 정리
- 기존 DB 충돌을 피하기 위해 검증은 신규 DB명(`stitch-server-auth`) 기준으로 수행

## Based on Design Doc

Reference: `.specs-fire/intents/stitch-design-implementation-kickoff/work-items/implement-account-player-session-foundation-design.md`

---
*Plan ready for Validate Checkpoint 2 approval.*
