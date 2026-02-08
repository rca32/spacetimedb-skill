---
run: run-011
work_item: implement-environment-debuff-and-status-effect-pipeline
intent: stitch-server-gap-closure-phase2
generated: 2026-02-08T10:54:00Z
mode: validate
---

# Implementation Walkthrough: 환경 디버프 및 상태효과 파이프라인 구현

## Summary
환경 효과 데이터(`environment_effect_desc`)와 런타임 상태(`environment_effect_state`, `environment_effect_exposure`)를 추가하고, scheduled reducer 기반 환경 효과 루프를 구현했다. 루프는 AOI 위치(현재 region/chunk biome) 기반으로 효과를 평가해 `resource_state` 피해, `status_effect` 적용/만료, 노출 감쇠를 처리한다.

## Files Changed

### Created
- `stitch-server/crates/game_server/src/tables/environment_effect.rs`

### Modified
- `stitch-server/crates/game_server/src/tables/agent_timers.rs`
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/agents/mod.rs`

## Verification
- `cargo check -p game_server` passed.
- `spacetime build` passed.
