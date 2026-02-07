---
id: establish-cli-integration-test-scenarios
title: CLI 기반 통합 시나리오 테스트 확립
intent: stitch-design-implementation-kickoff
complexity: medium
mode: confirm
status: pending
depends_on: [implement-authoritative-movement-and-anti-cheat-checks, implement-minimum-inventory-loop]
created: 2026-02-07T15:28:44Z
---

# Work Item: CLI 기반 통합 시나리오 테스트 확립

## Description

Spacetime CLI를 사용해 접속/플레이어 상태/이동/인벤토리 핵심 흐름을 재실행 가능한 통합 시나리오로 고정하고 검증 절차를 문서화한다.

## Acceptance Criteria

- [ ] 핵심 시나리오(초기화 -> 이동 -> 인벤토리 확인)가 명령 순서대로 재실행된다.
- [ ] 실패 시 원인 파악을 위한 SQL 조회/로그 확인 절차가 포함된다.
- [ ] 테스트 결과를 반복 실행해도 동일한 합격 기준을 만족한다.

## Technical Notes

- 기준 문서: `DESIGN/11-testing-evaluation.md`, `DESIGN/DETAIL/stitch-server-test-cases.md`
- `stitch-server-ai-tester` 스킬 워크플로와 정합성 유지

## Dependencies

- implement-authoritative-movement-and-anti-cheat-checks
- implement-minimum-inventory-loop
