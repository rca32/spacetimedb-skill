---
id: align-data-model-and-permissions
title: 데이터 모델/권한 설계 정렬
intent: mmo-core-server-foundation
complexity: high
mode: validate
status: pending
depends_on: []
created: 2026-02-07T14:35:19Z
---

# Work Item: 데이터 모델/권한 설계 정렬

## Description

`DESIGN/05-data-model-permissions.md`를 기준으로 권한 플래그, 테이블 경계, 접근 정책을 구현 가능한 계약으로 정제한다.

## Acceptance Criteria

- [ ] 권한 플래그 비트 정의와 우선순위가 문서화된다.
- [ ] `permission_state`, `building_state`, `claim_state` 접근 규칙이 명시된다.
- [ ] reducer 단 권한 검증 포인트가 표로 정리된다.
- [ ] 정책이 DESIGN 기준으로만 서술되고 외부 소스 의존 문구가 제거된다.

## Technical Notes

정책 표에는 최소한 `perm_view`, `perm_use`, `perm_build`, `perm_inventory`, `perm_trade`, `perm_admin`, `perm_owner`를 포함한다.

## Dependencies

(none)
