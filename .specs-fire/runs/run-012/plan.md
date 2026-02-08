---
run: run-012
scope: single
created: 2026-02-08T11:02:30Z
items:
  - implement-housing-interior-dimension-network-loop
---

# Implementation Plan - run-012

## Work Item: implement-housing-interior-dimension-network-loop

### Approach
- 주거 도메인 테이블(`housing_state`, `dimension_network`, `dimension_desc`, `rent_state`) 및 붕괴 타이머(`interior_collapse_timer`) 추가.
- 주거 생성/입장/출입구 변경/임대 화이트리스트/권한 전파 리듀서 구현.
- 인테리어 empty 상태를 스케줄러로 처리해 붕괴-재생성 루프(`interior_collapse_rebuild`) 구현.
- `permission_state`와 연동해 주거/차원 권한 전파를 서버에서 처리.

### Files to Create
- `stitch-server/crates/game_server/src/tables/housing.rs`
- `stitch-server/crates/game_server/src/reducers/housing/mod.rs`
- `stitch-server/crates/game_server/src/reducers/housing/housing_create.rs`
- `stitch-server/crates/game_server/src/reducers/housing/housing_enter.rs`
- `stitch-server/crates/game_server/src/reducers/housing/housing_change_entrance.rs`
- `stitch-server/crates/game_server/src/reducers/housing/rent_set_whitelist.rs`
- `stitch-server/crates/game_server/src/reducers/housing/interior_mark_empty.rs`
- `stitch-server/crates/game_server/src/reducers/housing/interior_collapse_rebuild.rs`
- `stitch-server/crates/game_server/src/reducers/housing/housing_propagate_permissions.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/reducers/mod.rs`
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/services/permissions.rs`

### Validation
- `cargo check -p game_server`
- `spacetime build` (game_server)
