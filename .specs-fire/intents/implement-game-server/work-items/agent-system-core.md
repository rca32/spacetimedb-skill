---
id: agent-system-core
title: Agent system core
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - auth-session-system
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T01:46:43.062Z
---

# Work Item: Agent system core

## Description

Implement agent infrastructure, feature flags, balance params, timers, and core agent loops.

## Acceptance Criteria

- [ ] Feature flags and balance params are initialized with defaults.
- [ ] Scheduled timer tables exist for all core agents.
- [ ] `agents::init`, `should_run`, and `should_run_agent` are implemented.
- [ ] Core agent loops run with server/admin validation and rescheduling.

## Technical Notes

Use `DESIGN/DETAIL/agent-system-design.md` and `DESIGN/DETAIL/player-regeneration-system.md`.

## Dependencies

- auth-session-system
