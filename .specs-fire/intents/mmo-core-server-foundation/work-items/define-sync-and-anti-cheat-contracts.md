---
id: define-sync-and-anti-cheat-contracts
title: 동기화/안티치트 계약 정의
intent: mmo-core-server-foundation
complexity: high
mode: validate
status: pending
depends_on: [align-data-model-and-permissions]
created: 2026-02-07T14:35:19Z
---

# Work Item: 동기화/안티치트 계약 정의

## Description

`DESIGN/06-sync-anti-cheat.md` 기반으로 서버 권위 검증 규칙, 동기화 주기, 위반 대응 플로우를 구현 계약으로 정리한다.

## Acceptance Criteria

- [ ] 서버 권위 범위와 클라이언트 예측 허용 범위가 분리 정의된다.
- [ ] 이동/행동/전투/거래 검증 규칙이 reducer 단위로 매핑된다.
- [ ] 고핑 보정, 레이트 리미팅, 이상 탐지 기준이 문서화된다.
- [ ] 위반 점수 누적 및 제재 프로세스 상태 전이가 명시된다.

## Technical Notes

스냅샷 주기(10-20Hz), 이벤트 즉시 푸시, 델타 전송, scheduled reducer 권한 제한을 포함한다.

## Dependencies

- align-data-model-and-permissions
