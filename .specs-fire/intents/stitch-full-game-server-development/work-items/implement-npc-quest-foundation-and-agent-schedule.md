---
id: implement-npc-quest-foundation-and-agent-schedule
title: NPC/퀘스트 기반 및 에이전트 스케줄 구현
intent: stitch-full-game-server-development
complexity: high
mode: validate
status: completed
depends_on:
  - migrate-auth-session-movement-foundation-into-domain-modules
created: 2026-02-07T16:08:40Z
run_id: run-005
completed_at: 2026-02-07T16:56:23.730Z
---

# Work Item: NPC/퀘스트 기반 및 에이전트 스케줄 구현

## Description

NPC 상태/행동 스케줄/요청-결과 테이블과 `npc_talk/npc_trade/npc_quest`, `quest_chain_start/quest_stage_complete` 최소 경로를 구현한다.

## Acceptance Criteria

- [ ] NPC 행동 요청-결과 경로가 테이블 기반으로 기록된다.
- [ ] 기본 퀘스트 시작/단계 완료 reducer가 동작한다.
- [ ] 스케줄드 에이전트(최소 1종)가 권한 검증 하에 실행된다.

## Technical Notes

- 기준 문서: `DESIGN/07-llm-npc-design.md`, `DESIGN/DETAIL/agent-system-design.md`

## Dependencies

- migrate-auth-session-movement-foundation-into-domain-modules
