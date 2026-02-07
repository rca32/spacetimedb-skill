---
run: run-004
work_item: implement-building-and-claim-core-reducers
intent: stitch-full-game-server-development
generated: 2026-02-07T16:30:35Z
mode: validate
---

# Implementation Plan: 건설/클레임 코어 리듀서 구현

Based on `DESIGN/DETAIL/building-system-design.md` and `DESIGN/DETAIL/stitch-claim-empire-management.md`.

## Implementation Checklist

- [x] building/claim 최소 테이블(`building_state`, `claim_state`, `permission_state`) 추가
- [x] `building_place`, `building_advance`, `building_deconstruct` reducer 구현
- [x] `claim_totem_place`, `claim_expand` reducer 구현
- [x] 권한/거리/재료 검증 서버 권위 경로 구현
- [x] 인벤토리 재료 소모와 건설 상태 전이(placed -> complete/deconstructed) 연동

## Files to Create

- `stitch-server/crates/game_server/src/tables/building_state.rs`
- `stitch-server/crates/game_server/src/tables/claim_state.rs`
- `stitch-server/crates/game_server/src/tables/permission_state.rs`
- `stitch-server/crates/game_server/src/reducers/building/mod.rs`
- `stitch-server/crates/game_server/src/reducers/building/building_place.rs`
- `stitch-server/crates/game_server/src/reducers/building/building_advance.rs`
- `stitch-server/crates/game_server/src/reducers/building/building_deconstruct.rs`
- `stitch-server/crates/game_server/src/reducers/claim/mod.rs`
- `stitch-server/crates/game_server/src/reducers/claim/claim_totem_place.rs`
- `stitch-server/crates/game_server/src/reducers/claim/claim_expand.rs`
- `stitch-server/crates/game_server/src/services/permissions.rs`

## Files to Modify

- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/reducers/mod.rs`
- `stitch-server/crates/game_server/src/services/mod.rs`

## Verification

- `cargo check -p game_server`
- `cd stitch-server/crates/game_server && spacetime build`
- CLI flow: inventory_bootstrap -> building_place -> building_advance -> claim_totem_place -> claim_expand -> building_deconstruct

## Risks and Mitigations

- 리듀서/테이블 이름 중복 위험: module별 이름 충돌 점검
- 재료 소모 정합성 위험: 공통 아이템 소비 헬퍼를 사용해 중복 구현 방지
