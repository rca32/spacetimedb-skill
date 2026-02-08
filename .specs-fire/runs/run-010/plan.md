---
run: run-010
scope: single
created: 2026-02-08T10:18:40Z
items:
  - implement-world-resource-and-regeneration-agent-loops
---

# Implementation Plan - run-010

## Work Item: implement-world-resource-and-regeneration-agent-loops

### Approach
- scheduled 테이블(`player_regen_loop_timer`, `resource_regen_loop_timer`, `session_cleanup_loop_timer`) 추가.
- init reducer에서 단일 타이머 보장 함수 호출.
- scheduled reducer에서 온라인 세션 기준 플레이어 재생/자원 노드 재생/비활성 세션 정리 수행.
- sign_in/account_bootstrap 경로에서 기본 `character_stats`/`resource_state`를 보장.

### Files to Create
- `stitch-server/crates/game_server/src/tables/agent_timers.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/agents/mod.rs`
- `stitch-server/crates/game_server/src/init.rs`
- `stitch-server/crates/game_server/src/auth/mod.rs`
- `stitch-server/crates/game_server/src/utils/mod.rs`
- `stitch-server/crates/game_server/src/tables/mod.rs`

### Validation
- `cargo check -p game_server`
- `spacetime build` (game_server)
