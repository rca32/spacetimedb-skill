---
id: server-test-suite
title: Server test suite
intent: implement-game-server
complexity: medium
mode: confirm
status: completed
depends_on:
  - auth-session-system
  - player-state-movement-skills
  - inventory-item-stacks
  - combat-pvp-pipeline
  - worldgen-terrain-pathfinding
  - claim-permission-empire-housing
  - building-system-core
  - npc-ai-conversation
  - trade-auction-barter
  - quest-achievement-system
  - agent-system-core
  - environment-debuffs-status
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T08:37:14.083Z
---

# Work Item: Server test suite

## Description

Implement unit/integration/security/load test harness and fixtures aligned to DESIGN/DETAIL test cases.

## Acceptance Criteria

- [ ] Unit tests cover auth, inventory, combat, quest reducers per test plan.
- [ ] Integration tests cover trade, claim, and NPC AI scenarios.
- [ ] Load and security test scaffolding exists with fixtures.
- [ ] Test pipeline ordering matches the design document.

## Technical Notes

Reference `DESIGN/DETAIL/stitch-server-test-cases.md`.

## Dependencies

- auth-session-system
- player-state-movement-skills
- inventory-item-stacks
- combat-pvp-pipeline
- worldgen-terrain-pathfinding
- claim-permission-empire-housing
- building-system-core
- npc-ai-conversation
- trade-auction-barter
- quest-achievement-system
- agent-system-core
- environment-debuffs-status
