---
id: establish-full-cli-integration-regression-suite
title: 전체 기능 CLI 통합 회귀 시나리오 확립
intent: stitch-full-game-server-development
complexity: medium
mode: confirm
status: pending
depends_on: [implement-building-and-claim-core-reducers, implement-combat-loop-and-combat-state, implement-npc-quest-foundation-and-agent-schedule, implement-trade-and-market-core-loop, implement-subscription-streams-and-aoi-query-paths, build-static-data-loader-and-asset-pipeline]
created: 2026-02-07T16:08:40Z
---

# Work Item: 전체 기능 CLI 통합 회귀 시나리오 확립

## Description

접속→이동→인벤토리→건설/클레임→전투→NPC/퀘스트→거래 흐름을 CLI 시나리오로 표준화하고 실패 진단 SQL/로그 절차를 문서화한다.

## Acceptance Criteria

- [ ] 핵심 도메인 흐름이 단일/분할 시나리오로 반복 재실행된다.
- [ ] 실패 시 진단 SQL과 점검 순서가 문서화된다.
- [ ] 반복 실행에서 동일 합격 기준을 만족한다.

## Technical Notes

- 기준 문서: `DESIGN/11-testing-evaluation.md`, `DESIGN/DETAIL/stitch-server-test-cases.md`
- `stitch-server-ai-tester` 워크플로와 정합 유지

## Dependencies

- implement-building-and-claim-core-reducers
- implement-combat-loop-and-combat-state
- implement-npc-quest-foundation-and-agent-schedule
- implement-trade-and-market-core-loop
- implement-subscription-streams-and-aoi-query-paths
- build-static-data-loader-and-asset-pipeline
