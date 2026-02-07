---
id: implement-minimum-inventory-loop
title: 최소 인벤토리 루프 구현 (컨테이너/슬롯/아이템 조회)
intent: stitch-design-implementation-kickoff
complexity: medium
mode: confirm
status: pending
depends_on: [implement-account-player-session-foundation]
created: 2026-02-07T15:28:44Z
---

# Work Item: 최소 인벤토리 루프 구현 (컨테이너/슬롯/아이템 조회)

## Description

플레이어 기준 인벤토리 컨테이너와 슬롯 구조를 연결하고, 기본 아이템 조회/적재 경로를 구현해 플레이 루프의 최소 상태 가시성을 확보한다.

## Acceptance Criteria

- [ ] 플레이어 인벤토리 컨테이너/슬롯이 초기화되고 조회 가능하다.
- [ ] 기본 아이템 정의(`item_def`)와 슬롯 데이터가 연결되어 표시된다.
- [ ] 잠금/용량 위반 같은 기본 가드레일이 서버에서 검증된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/stitch-inventory-item-stacks.md`
- 거래/제작 잠금의 전체 구현은 후속 work item으로 분리

## Dependencies

- implement-account-player-session-foundation
