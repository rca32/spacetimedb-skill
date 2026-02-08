---
id: implement-housing-interior-dimension-network-loop
title: 주거 인테리어 차원 네트워크 루프 구현
intent: stitch-server-gap-closure-phase2
complexity: high
mode: validate
status: pending
depends_on:
  - establish-extended-schema-for-liveops-social-security-domains
created: 2026-02-08T09:50:00Z
---

# Work Item: 주거 인테리어 차원 네트워크 루프 구현

## Description

`housing_state`, `dimension_network`, `dimension_desc`, `rent_state`를 도입하고,
입장/이동/잠금/붕괴-재생성/권한 전파 reducer 및 스케줄러를 구현한다.

## Acceptance Criteria

- [ ] 주거 입장/출구/이동 흐름과 잠금 시간 정책이 동작한다.
- [ ] 인테리어 붕괴/재생성 타이머가 서버 권위로 처리된다.
- [ ] 임대 화이트리스트와 `permission_state` 연계 검증이 적용된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/stitch-housing-interior.md`, `DESIGN/DETAIL/stitch-permission-access-control.md`

## Dependencies

- establish-extended-schema-for-liveops-social-security-domains
