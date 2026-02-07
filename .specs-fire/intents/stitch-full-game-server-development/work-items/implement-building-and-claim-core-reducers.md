---
id: implement-building-and-claim-core-reducers
title: 건설/클레임 코어 리듀서 구현
intent: stitch-full-game-server-development
complexity: high
mode: validate
status: pending
depends_on: [implement-inventory-container-slot-item-loop]
created: 2026-02-07T16:08:40Z
---

# Work Item: 건설/클레임 코어 리듀서 구현

## Description

건설 배치/진행/해체와 클레임 토템/확장 핵심 리듀서를 구현하고, 권한/거리/재료 검증을 서버 권위로 확정한다.

## Acceptance Criteria

- [ ] 건설 배치/진행/해체 reducer가 최소 동작한다.
- [ ] 클레임 배치/확장 reducer가 권한/거리 규칙을 검증한다.
- [ ] 인벤토리 재료 소모와 건설 상태 전이가 일관되게 반영된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/building-system-design.md`, `DESIGN/DETAIL/stitch-claim-empire-management.md`

## Dependencies

- implement-inventory-container-slot-item-loop
