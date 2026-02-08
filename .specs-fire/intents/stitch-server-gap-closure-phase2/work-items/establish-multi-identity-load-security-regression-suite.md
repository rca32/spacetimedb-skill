---
id: establish-multi-identity-load-security-regression-suite
title: 다중 Identity/부하/보안 회귀 스위트 확립
intent: stitch-server-gap-closure-phase2
complexity: medium
mode: confirm
status: pending
depends_on:
  - implement-world-resource-and-regeneration-agent-loops
  - implement-environment-debuff-and-status-effect-pipeline
  - implement-housing-interior-dimension-network-loop
  - implement-social-chat-party-guild-core-loop
  - implement-moderation-audit-and-role-based-admin-controls
  - implement-economy-wallet-tax-price-index-and-market-settlement
created: 2026-02-08T09:50:00Z
---

# Work Item: 다중 Identity/부하/보안 회귀 스위트 확립

## Description

기존 CLI 회귀를 다중 identity 전제로 확장해 전투/거래 성공 경로를 포함하고,
보안(권한 상승/세션 하이재킹/RLS 누출)과 부하(AOI/에이전트) 시나리오까지 자동 실행 가능하게 정리한다.

## Acceptance Criteria

- [ ] 2개 이상 identity 기반 성공/실패 시나리오가 자동 재실행된다.
- [ ] 보안 회귀(SEC-001~003 계열)와 부하 점검 절차가 문서/스크립트로 고정된다.
- [ ] 실패 시 진단 SQL/로그 절차가 도메인별로 업데이트된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/stitch-server-test-cases.md`, `DESIGN/11-testing-evaluation.md`

## Dependencies

- implement-world-resource-and-regeneration-agent-loops
- implement-environment-debuff-and-status-effect-pipeline
- implement-housing-interior-dimension-network-loop
- implement-social-chat-party-guild-core-loop
- implement-moderation-audit-and-role-based-admin-controls
- implement-economy-wallet-tax-price-index-and-market-settlement
