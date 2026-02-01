---
id: npc-ai-conversation
title: NPC AI and conversation pipeline
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - player-state-movement-skills
  - worldgen-terrain-pathfinding
  - agent-system-core
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T06:29:20.797Z
---

# Work Item: NPC AI and conversation pipeline

## Description

Implement NPC scheduling, action requests/results, conversation sessions, memory/relations, and policy violation tracking.

## Acceptance Criteria

- [ ] NPC state, schedule, request/result, and memory tables are implemented.
- [ ] NPC AI agent loop creates action requests and schedules next actions.
- [ ] Conversation sessions and turns are stored with proper privacy controls.
- [ ] Policy violation and response cache handling works.

## Technical Notes

Reference `DESIGN/DETAIL/stitch-npc-ai-behavior.md`.

## Dependencies

- player-state-movement-skills
- worldgen-terrain-pathfinding
- agent-system-core
