---
run: run-003
work_item: implement-inventory-container-slot-item-loop
intent: stitch-full-game-server-development
generated: 2026-02-07T16:23:15Z
mode: confirm
---

# Implementation Plan: 인벤토리 컨테이너/슬롯/아이템 루프 구현

Based on `DESIGN/DETAIL/stitch-inventory-item-stacks.md`.

## Approach

- 최소 루프에 필요한 테이블(`inventory_container`, `inventory_slot`, `item_instance`, `item_stack`, `inventory_lock`)을 `tables/`로 추가한다.
- 기본 서비스 계층 `services/economy.rs`에 인벤토리 용량/잠금 검증 헬퍼를 둔다.
- `reducers/inventory/*`에 다음 최소 reducer를 구현한다.
  - `inventory_bootstrap`: 플레이어 기본 컨테이너/빈 슬롯 생성
  - `inventory_lock` / `inventory_unlock`: 컨테이너 잠금 제어
  - `item_stack_move`: 슬롯 간 이동(동일 아이템 스택 합치기 포함)
- 이동 시 서버 검증: 소유자 확인, 잠금 확인, 슬롯 범위/용량 검증.

## Files to Create

- `stitch-server/crates/game_server/src/tables/inventory_container.rs`
- `stitch-server/crates/game_server/src/tables/inventory_slot.rs`
- `stitch-server/crates/game_server/src/tables/item_instance.rs`
- `stitch-server/crates/game_server/src/tables/item_stack.rs`
- `stitch-server/crates/game_server/src/tables/inventory_lock.rs`
- `stitch-server/crates/game_server/src/reducers/inventory/mod.rs`
- `stitch-server/crates/game_server/src/reducers/inventory/inventory_bootstrap.rs`
- `stitch-server/crates/game_server/src/reducers/inventory/item_stack_move.rs`
- `stitch-server/crates/game_server/src/reducers/inventory/inventory_lock.rs`
- `stitch-server/crates/game_server/src/services/economy.rs`

## Files to Modify

- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/reducers/mod.rs`
- `stitch-server/crates/game_server/src/services/mod.rs`
- `stitch-server/crates/game_server/src/lib.rs`

## Verification

- `cargo check -p game_server`
- `cd stitch-server/crates/game_server && spacetime build`
- CLI 시나리오: bootstrap/sign_in/inventory_bootstrap/item_stack_move/inventory_lock

## Risks

- SpacetimeDB 복합 PK/trait 접근 시 컴파일 오류 가능
- 대응: 기존 패턴처럼 각 모듈에서 table trait import를 명시하고 단계별로 빌드 검증
