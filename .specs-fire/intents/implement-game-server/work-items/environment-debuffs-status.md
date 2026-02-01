---
id: environment-debuffs-status
title: Environment debuffs and status effects
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - agent-system-core
  - worldgen-terrain-pathfinding
  - player-state-movement-skills
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T06:40:37.861Z
---

# Work Item: Environment debuffs and status effects

## Description

Implement environment effect definitions, exposure tracking, agent loop, and buff/damage integration.

## Acceptance Criteria

- [ ] Environment effect tables and balance params are defined.
- [ ] Agent loop evaluates effects for online players and applies exposure.
- [ ] Buff activation/deactivation and damage ticks follow design rules.
- [ ] Performance safeguards (cache, interval checks) are in place.

## Technical Notes

Follow `DESIGN/DETAIL/environment-debuffs-and-status-effects.md`.

## Dependencies

- agent-system-core
- worldgen-terrain-pathfinding
- player-state-movement-skills
