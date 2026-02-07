---
id: implement-subscription-streams-and-aoi-query-paths
title: 구독 스트림 및 AOI 조회 경로 구현
intent: stitch-full-game-server-development
complexity: medium
mode: confirm
status: pending
depends_on: [migrate-auth-session-movement-foundation-into-domain-modules, implement-combat-loop-and-combat-state]
created: 2026-02-07T16:08:40Z
---

# Work Item: 구독 스트림 및 AOI 조회 경로 구현

## Description

`subscriptions/aoi.rs`, `building_stream.rs`, `combat_stream.rs`, `inventory_stream.rs`를 구현해 관심영역 기반 데이터 전파 경로를 고정한다.

## Acceptance Criteria

- [ ] AOI 기준 위치/건설/전투/인벤토리 스트림 쿼리가 분리 정의된다.
- [ ] 과도한 전체 구독 없이 필터 기반 구독 경로가 제공된다.
- [ ] 핵심 reducer 이후 테이블 변경이 구독으로 관찰 가능하다.

## Technical Notes

- 기준 문서: `DESIGN/06-sync-anti-cheat.md`, `DESIGN/05-data-model.md`

## Dependencies

- migrate-auth-session-movement-foundation-into-domain-modules
- implement-combat-loop-and-combat-state
