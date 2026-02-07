---
run: run-002
work_item: migrate-auth-session-movement-foundation-into-domain-modules
intent: stitch-full-game-server-development
generated: 2026-02-07T16:17:55Z
mode: validate
---

# Implementation Plan: 기존 인증/세션/이동 기반을 도메인 모듈로 이전

Based on `DESIGN/04-server-architecture.md` and `DESIGN/06-sync-anti-cheat.md`.

## Implementation Checklist

- [x] account/session/transform/movement 테이블 정의를 `tables/` 도메인 파일로 분리
- [x] 인증/세션 reducer를 `auth/` 하위로 이동하고 공개 인터페이스 정렬
- [x] 이동 reducer를 `reducers/player/`로 이동
- [x] 이동 검증/위반 로직을 `validation/anti_cheat.rs`로 분리
- [x] 리팩터링 후 기존 CLI 시나리오(bootstrap/sign_in/sign_out/move_to) 동등성 확인

## Files to Create

- `stitch-server/crates/game_server/src/tables/account.rs`
- `stitch-server/crates/game_server/src/tables/player_state.rs`
- `stitch-server/crates/game_server/src/tables/session_state.rs`
- `stitch-server/crates/game_server/src/tables/transform_state.rs`
- `stitch-server/crates/game_server/src/tables/movement.rs`
- `stitch-server/crates/game_server/src/tables/item_def.rs`
- `stitch-server/crates/game_server/src/auth/account_bootstrap.rs`
- `stitch-server/crates/game_server/src/auth/sign_in.rs`
- `stitch-server/crates/game_server/src/auth/sign_out.rs`
- `stitch-server/crates/game_server/src/reducers/player/mod.rs`
- `stitch-server/crates/game_server/src/reducers/player/move_player.rs`
- `stitch-server/crates/game_server/src/validation/anti_cheat.rs`

## Files to Modify

- `stitch-server/crates/game_server/src/lib.rs`
- `stitch-server/crates/game_server/src/auth/mod.rs`
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/reducers/mod.rs`
- `stitch-server/crates/game_server/src/validation/mod.rs`
- `stitch-server/crates/game_server/src/module.rs`

## Verification

- `cargo check -p game_server`
- `cd stitch-server/crates/game_server && spacetime build`
- `spacetime call ... account_bootstrap/sign_in/move_to/sign_out` 기본 경로 수동 점검

## Risks and Mitigations

- 모듈 분리 과정에서 `Table` trait import 누락으로 빌드 실패 위험
- 대응: 각 reducer/helper 파일에 필요한 `spacetimedb::Table` import를 명시하고 `cargo check` 즉시 검증
