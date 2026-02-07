---
id: implement-combat-loop-and-combat-state
title: 전투 루프 및 combat_state 구현
intent: stitch-full-game-server-development
complexity: high
mode: validate
status: pending
depends_on: [migrate-auth-session-movement-foundation-into-domain-modules]
created: 2026-02-07T16:08:40Z
---

# Work Item: 전투 루프 및 combat_state 구현

## Description

`attack_start/attack_scheduled/attack_impact` 흐름과 `combat_state/threat_state/attack_outcome`를 구현해 사거리/쿨다운/타격 시점 재검증을 서버에서 수행한다.

## Acceptance Criteria

- [ ] 공격 시작/예약/타격 3단계 reducer가 동작한다.
- [ ] 사거리/쿨다운/상태 검증 실패가 명시적으로 거부된다.
- [ ] 타격 결과와 전투 상태가 테이블에 일관되게 기록된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/stitch-combat-and-pvp.md`, `DESIGN/06-sync-anti-cheat.md`

## Dependencies

- migrate-auth-session-movement-foundation-into-domain-modules
