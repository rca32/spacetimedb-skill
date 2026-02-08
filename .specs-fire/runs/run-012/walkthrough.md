---
run: run-012
work_item: implement-housing-interior-dimension-network-loop
intent: stitch-server-gap-closure-phase2
generated: 2026-02-08T11:18:00Z
mode: validate
---

# Implementation Walkthrough: 주거 인테리어 차원 네트워크 루프 구현

## Summary
주거 도메인 테이블과 핵심 리듀서를 추가해 주거 입장/이동/잠금/임대 화이트리스트/권한 전파를 서버 권위로 처리하도록 구성했다. 인테리어 붕괴-재생성은 scheduled table 기반 타이머로 구현해 empty 상태 이후 자동 복구 루프를 연결했다.

## Files Changed

### Created
- `stitch-server/crates/game_server/src/tables/housing.rs`
- `stitch-server/crates/game_server/src/reducers/housing/mod.rs`
- `stitch-server/crates/game_server/src/reducers/housing/housing_create.rs`
- `stitch-server/crates/game_server/src/reducers/housing/housing_enter.rs`
- `stitch-server/crates/game_server/src/reducers/housing/housing_change_entrance.rs`
- `stitch-server/crates/game_server/src/reducers/housing/rent_set_whitelist.rs`
- `stitch-server/crates/game_server/src/reducers/housing/interior_mark_empty.rs`
- `stitch-server/crates/game_server/src/reducers/housing/interior_collapse_rebuild.rs`
- `stitch-server/crates/game_server/src/reducers/housing/housing_propagate_permissions.rs`

### Modified
- `stitch-server/crates/game_server/src/reducers/mod.rs`
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/services/permissions.rs`

## Verification
- `cargo check -p game_server` passed.
- `spacetime build` passed.
