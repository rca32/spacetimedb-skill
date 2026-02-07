---
id: stitch-full-game-server-development
title: Stitch 서버 전체 게임 기능 개발 (폴더 구조 상세 설계 기반)
status: in_progress
created: 2026-02-07T16:08:40Z
---

# Intent: Stitch 서버 전체 게임 기능 개발 (폴더 구조 상세 설계 기반)

## Goal

`DESIGN/DETAIL/stitch-server-folder-structure.md`를 기준으로 game_server를 도메인 모듈 구조로 재편하고,
인벤토리/건설/클레임/전투/NPC/거래/퀘스트까지 서버 권위 기능을 순차 구현해 실제 플레이 가능한 코어 루프를 완성한다.

## Users

- 서버 개발자 (SpacetimeDB 모듈 구현)
- 게임플레이 시스템 개발자 (도메인 규칙/리듀서 구현)
- QA/밸런스 담당자 (CLI 통합 시나리오 검증)

## Problem

현재 구현은 초기 부트스트랩 단계로 `lib.rs` 중심 구조에 가깝고,
상세 설계가 제시하는 도메인 분리(`tables/`, `reducers/`, `services/`, `validation/`, `agents/`, `subscriptions/`)와
완전한 게임 개발에 필요한 기능 표면이 충분히 갖춰지지 않았다.

## Success Criteria

- `crates/game_server/src`가 상세 설계 문서의 모듈 경계와 확장 규칙을 따른다.
- 도메인별 핵심 테이블/리듀서가 분리 구현되어 플레이 핵심 루프(이동/인벤토리/전투/거래/퀘스트)가 동작한다.
- 정적 데이터 적재와 운영 보조 구조(`assets/static_data`, `scripts`, `tools`)가 개발 루프에 연결된다.
- CLI 기반 통합 시나리오로 핵심 흐름을 반복 검증할 수 있다.

## Constraints

- `DESIGN/` 문서를 유일한 설계 기준으로 사용한다.
- `BitCraftPublicDoc/`, `BitCraftPublic/BitCraftServer/`는 참고만 사용한다.
- SpacetimeDB 작업은 `.agents/skills/spacetimedb-korean/SKILL.md` 규칙을 준수한다.
- 각 work item은 단일 run에서 완료 가능한 수직 슬라이스로 유지한다.

## Notes

기존 intent(`stitch-design-implementation-kickoff`)의 미완료 항목과 충돌하지 않도록,
본 intent는 "전체 구조/기능 확장" 중심으로 독립 백로그를 구성한다.
