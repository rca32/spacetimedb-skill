---
id: implement-trade-and-market-core-loop
title: 거래/경매 코어 루프 구현
intent: stitch-full-game-server-development
complexity: high
mode: validate
status: pending
depends_on: [implement-inventory-container-slot-item-loop]
created: 2026-02-07T16:08:40Z
---

# Work Item: 거래/경매 코어 루프 구현

## Description

거래 세션과 경매 주문/체결 핵심 reducer를 구현하고 거리/잠금/중복체결 방지 규칙을 서버에서 검증한다.

## Acceptance Criteria

- [ ] 거래 세션 생성/아이템 추가/수락 흐름이 동작한다.
- [ ] 경매 등록/취소/기본 체결 경로가 동작한다.
- [ ] 잠금/거리/중복 요청 방지 검증이 적용된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/stitch-trade-and-auction.md`, `DESIGN/12-economy-inflation.md`

## Dependencies

- implement-inventory-container-slot-item-loop
