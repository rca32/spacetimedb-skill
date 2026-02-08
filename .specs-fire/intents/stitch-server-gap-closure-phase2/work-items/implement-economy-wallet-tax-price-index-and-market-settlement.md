---
id: implement-economy-wallet-tax-price-index-and-market-settlement
title: 월렛/세금/가격지수 기반 경제 정산 루프 구현
intent: stitch-server-gap-closure-phase2
complexity: high
mode: validate
status: completed
depends_on:
  - establish-extended-schema-for-liveops-social-security-domains
  - implement-world-resource-and-regeneration-agent-loops
created: 2026-02-08T09:50:00Z
run_id: run-015
completed_at: 2026-02-08T07:07:46.128Z
---

# Work Item: 월렛/세금/가격지수 기반 경제 정산 루프 구현

## Description

`wallet`, `currency_txn`, `tax_policy`, `price_index`, `economy_params`를 추가하고,
기존 거래/마켓 체결 경로를 경제 정산(세금, 잔액, 지표 업데이트)까지 확장한다.

## Acceptance Criteria

- [ ] 거래/주문 체결 시 월렛 잔액과 거래 내역이 일관되게 갱신된다.
- [ ] 세율 정책과 수수료 반영이 파라미터 기반으로 동작한다.
- [ ] `price_index` 및 경제 지표 스냅샷이 생성된다.

## Technical Notes

- 기준 문서: `DESIGN/12-economy-inflation.md`, `DESIGN/05-data-model.md`, `DESIGN/DETAIL/stitch-trade-and-auction.md`

## Dependencies

- establish-extended-schema-for-liveops-social-security-domains
- implement-world-resource-and-regeneration-agent-loops
