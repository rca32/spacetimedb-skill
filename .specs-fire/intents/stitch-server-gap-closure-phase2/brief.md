---
id: stitch-server-gap-closure-phase2
title: Stitch 서버 누락 시스템 보강 개발 (DESIGN 정합성 2차)
status: in_progress
created: 2026-02-08T09:50:00Z
---

# Intent: Stitch 서버 누락 시스템 보강 개발 (DESIGN 정합성 2차)

## Goal

기존 코어 루프 구현 이후 남아있는 DESIGN 범위(월드/재생/상태효과/주거/소셜/운영보안/라이브옵스)를
`stitch-server`에 단계적으로 추가해 실제 운영 가능한 서버 표면을 완성한다.

## Users

- 서버 개발자 (SpacetimeDB 테이블/리듀서/에이전트 확장)
- 콘텐츠/시스템 디자이너 (DESIGN 기반 규칙 반영)
- QA/운영 담당자 (다중 identity 회귀/보안/부하 검증)

## Problem

현재 구현은 인벤토리/건설/전투/거래/퀘스트의 코어 경로는 갖췄지만,
DESIGN 문서가 요구하는 소셜/운영 보안/월드 생성·자원/재생·환경효과/주거 인테리어/라이브옵스 제어가
부분 또는 미구현 상태라서 전체 게임 서버 완성도로 보기 어렵다.

## Success Criteria

- DESIGN/05 데이터 모델 핵심 누락 테이블군이 코드에 반영된다.
- 재생/환경 디버프/상태효과/월드 자원 루프가 서버 권위로 동작한다.
- 주거/인테리어 차원 네트워크와 소셜(채팅/파티/길드) 코어 흐름이 동작한다.
- 운영 보안(역할/중재/감사/레이트리밋)과 라이브옵스 제어(플래그/메트릭)가 작동한다.
- 다중 identity 기반 CLI 회귀 + 보안/부하 시나리오로 반복 검증된다.

## Constraints

- 설계 기준은 `DESIGN/` 및 `DESIGN/DETAIL/` 문서만 사용한다.
- `BitCraftPublicDoc/`, `BitCraftPublic/BitCraftServer/`는 참고로만 사용한다.
- SpacetimeDB 작업은 `.opencode/skills/spacetimedb-korean/SKILL.md` 규칙을 준수한다.
- 각 work item은 단일 run에서 완료 가능한 수직 슬라이스로 유지한다.

## Notes

기존 intent(`stitch-full-game-server-development`)의 완료 범위를 유지하면서,
누락/확장 범위를 별도 phase2 백로그로 분리한다.
