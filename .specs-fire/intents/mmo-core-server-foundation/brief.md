---
id: mmo-core-server-foundation
title: MMO 코어 서버 설계 정렬 (DESIGN -> FIRE)
status: completed
created: 2026-02-07T14:35:19Z
completed_at: 2026-02-07T15:11:23.540Z
---

# Intent: MMO 코어 서버 설계 정렬 (DESIGN -> FIRE)

## Goal

`DESIGN/`에 정의된 MMO RPG 서버 설계를 FIRE 방법론(Intent -> Work Item -> Run)으로 실행 가능한 계획 단위로 전환한다.

## Users

서버 개발자, 게임 시스템 디자이너, 운영/테스트 담당자

## Problem

설계 문서는 존재하지만 실행 단위(우선순위, 의존성, 검증 기준)로 분해되지 않아 구현과 검증이 일관되게 진행되기 어렵다.

## Success Criteria

- `DESIGN` 핵심 문서가 FIRE work item으로 분해되어 상태 파일에 반영된다.
- 각 work item이 acceptance criteria와 의존성을 가진다.
- 고복잡도 항목은 validate 모드로 분류되어 설계 검토 문서 생성이 가능하다.
- 설계 기준은 프로젝트 문서를 우선하고 외부 레퍼런스 의존을 배제한다.

## Constraints

- `DESIGN/`이 진실 소스다.
- `BitCraftPublicDoc/`, `BitCraftPublic/BitCraftServer/`는 참고 용도다.
- SpacetimeDB 작업 규칙은 `.opencode/skills/spacetimedb-korean/SKILL.md`를 따른다.
- 테이블/리듀서/모듈 명칭은 프로젝트 문서 정의를 우선 사용한다.

## Notes

초기 범위는 다음 문서군을 기준으로 시작한다.
- `DESIGN/05-data-model-permissions.md`
- `DESIGN/06-sync-anti-cheat.md`
- `DESIGN/DETAIL/world-generation-system.md`
- `DESIGN/DETAIL/player-regeneration-system.md`
