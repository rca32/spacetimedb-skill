---
run: run-011
scope: single
created: 2026-02-08T10:37:40Z
items:
  - implement-environment-debuff-and-status-effect-pipeline
---

# Implementation Plan - run-011

## Work Item: implement-environment-debuff-and-status-effect-pipeline

### Approach
- 환경 효과 정의/상태/노출 테이블 추가(`environment_effect_*`).
- scheduled 에이전트 루프(`environment_effect_agent_loop`)를 타이머 체계에 연결.
- 지형 biome + 플레이어 위치 기반으로 효과 활성/감쇠를 계산.
- `resource_state` 피해 적용, `status_effect` upsert/만료 정리를 통합.
- 피해 간격/노출 게이트/감쇠 스케일은 `balance_params` 키로 조정 가능하게 구성.

### Files to Create
- `stitch-server/crates/game_server/src/tables/environment_effect.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/tables/agent_timers.rs`
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/agents/mod.rs`

### Validation
- `cargo check -p game_server`
- `spacetime build` (game_server)
