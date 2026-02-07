---
id: define-world-generation-contracts
title: 월드 생성 계약 정의
intent: mmo-core-server-foundation
complexity: medium
mode: confirm
status: pending
depends_on: [align-data-model-and-permissions]
created: 2026-02-07T14:35:19Z
---

# Work Item: 월드 생성 계약 정의

## Description

`DESIGN/DETAIL/world-generation-system.md` 내용을 서버 모듈 관점의 테이블/리듀서/파라미터 계약으로 전환한다.

## Acceptance Criteria

- [ ] 좌표계, 청크 모델, 바이옴/리소스 생성 규칙이 계약 형태로 정리된다.
- [ ] 생성 파라미터(시드, 청크 크기, 노이즈 설정)와 검증 규칙이 명시된다.
- [ ] 월드 생성 결과를 구독/조회할 테이블 범위가 정의된다.
- [ ] 프로젝트 정책 기반 수치만 사용하고 외부 게임 근거 인용을 제거한다.

## Technical Notes

Deterministic 생성 보장을 위해 seed 처리와 재현성 검증 기준을 포함한다.

## Dependencies

- align-data-model-and-permissions
