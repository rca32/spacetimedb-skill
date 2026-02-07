---
id: stitch-design-implementation-kickoff
title: Stitch 게임 서버 실개발 착수 (DESIGN 기반)
status: in_progress
created: 2026-02-07T15:28:44Z
---

# Intent: Stitch 게임 서버 실개발 착수 (DESIGN 기반)

## Goal

`DESIGN/` 문서에 정의된 서버 권위 MMO 설계를 기준으로 SpacetimeDB 기반 실제 개발을 시작하고, 구현 가능한 실행 단위로 진행한다.

## Users

서버 개발자, 게임 시스템 디자이너, QA/통합 테스트 담당자

## Problem

상세 설계는 준비되어 있으나, 구현 우선순위와 검증 가능한 개발 단위가 확정되지 않아 실제 개발 착수가 지연된다.

## Success Criteria

- `stitch-server` 모듈이 로컬 SpacetimeDB에서 빌드/퍼블리시되고 기본 시드 데이터 로딩이 가능하다.
- 최소 플레이 가능 루프(접속/플레이어 상태/이동/기본 인벤토리 조회)가 서버 권위 reducer 경로로 동작한다.
- 핵심 reducer 흐름에 대한 통합 시나리오 테스트를 CLI 기반으로 재실행 가능하게 만든다.
- 개발 결과가 `DESIGN` 문서의 테이블/리듀서/모듈 계약과 추적 가능하게 연결된다.

## Constraints

- `DESIGN/`이 진실 소스다.
- `BitCraftPublicDoc/`, `BitCraftPublic/BitCraftServer/`는 참고 용도다.
- SpacetimeDB 관련 작업은 `.opencode/skills/spacetimedb-korean/SKILL.md`를 따른다.
- 서버 권위, 권한 통제, 안티치트 검증 원칙을 유지한다.

## Notes

초기 착수 기준 문서:
- `DESIGN/20-stitch-core-systems.md`
- `DESIGN/04-server-architecture.md`
- `DESIGN/06-sync-anti-cheat.md`
- `DESIGN/05-data-model.md`
- `DESIGN/11-testing-evaluation.md`
