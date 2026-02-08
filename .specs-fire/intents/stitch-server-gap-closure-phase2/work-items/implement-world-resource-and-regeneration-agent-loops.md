---
id: implement-world-resource-and-regeneration-agent-loops
title: 월드 자원/재생 에이전트 루프 구현
intent: stitch-server-gap-closure-phase2
complexity: high
mode: validate
status: completed
depends_on:
  - establish-extended-schema-for-liveops-social-security-domains
created: 2026-02-08T09:50:00Z
run_id: run-010
completed_at: 2026-02-08T10:32:00Z
---

# Work Item: 월드 자원/재생 에이전트 루프 구현

## Description

`resource_state`, `resource_node`, `terrain_chunk`, `instance_state`를 기반으로
플레이어 재생/자원 재생/세션 정리/기본 월드 루프를 에이전트로 구현한다.

## Acceptance Criteria

- [x] 플레이어 HP/스태미나/포만감 재생 루프가 서버에서 주기 실행된다.
- [x] 자원 노드 재생 및 기본 월드 상태 갱신 루프가 동작한다.
- [x] 타이머 중복 방지와 재시작 복구(init 시 단일 스케줄 보장)가 동작한다.

## Technical Notes

- 기준 문서: `DESIGN/02-systems-design.md`, `DESIGN/DETAIL/player-regeneration-system.md`, `DESIGN/DETAIL/world-generation-system.md`

## Dependencies

- establish-extended-schema-for-liveops-social-security-domains
