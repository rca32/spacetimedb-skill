---
id: implement-inventory-container-slot-item-loop
title: 인벤토리 컨테이너/슬롯/아이템 루프 구현
intent: stitch-full-game-server-development
complexity: medium
mode: confirm
status: completed
depends_on:
  - migrate-auth-session-movement-foundation-into-domain-modules
created: 2026-02-07T16:08:40Z
run_id: run-003
completed_at: 2026-02-07T16:29:17.050Z
---

# Work Item: 인벤토리 컨테이너/슬롯/아이템 루프 구현

## Description

`tables/inventory_*`, `tables/item_*`, `reducers/inventory/*`, `services/economy.rs`의 최소 경로를 연결해 플레이어 인벤토리 조회/적재/이동 기본 루프를 구현한다.

## Acceptance Criteria

- [ ] 플레이어 인벤토리 컨테이너/슬롯이 생성/조회된다.
- [ ] item_def와 item_stack이 연결되어 슬롯 상태를 조회할 수 있다.
- [ ] 용량/잠금 위반이 서버에서 검증된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/stitch-inventory-item-stacks.md`
- 기존 pending item(`implement-minimum-inventory-loop`)을 흡수하는 구현 범위

## Dependencies

- migrate-auth-session-movement-foundation-into-domain-modules
