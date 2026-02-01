---
id: quest-achievement-system
title: Quest and achievement system
intent: implement-game-server
complexity: medium
mode: confirm
status: completed
depends_on:
  - inventory-item-stacks
  - player-state-movement-skills
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T03:44:11.924Z
---

# Work Item: Quest and achievement system

## Description

Implement quest chains/stages and achievement discover/acquire flows with rewards.

## Acceptance Criteria

- [ ] Quest chain/state tables and reducers for start/complete exist.
- [ ] Achievement discover/acquire logic runs with reward distribution.
- [ ] Item/XP rewards handle inventory overflow rules.
- [ ] Event-driven evaluation avoids full scans.

## Technical Notes

Reference `DESIGN/DETAIL/stitch-quest-achievement.md`.

## Dependencies

- inventory-item-stacks
- player-state-movement-skills
