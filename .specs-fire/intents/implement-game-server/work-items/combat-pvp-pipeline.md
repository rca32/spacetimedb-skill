---
id: combat-pvp-pipeline
title: Combat and PvP pipeline
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - player-state-movement-skills
  - inventory-item-stacks
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T03:20:39.761Z
---

# Work Item: Combat and PvP pipeline

## Description

Implement combat tables, attack timers, attack/impact reducers, threat handling, damage calculation, and duel agent.

## Acceptance Criteria

- [ ] Combat tables and scheduled timers are defined per design.
- [ ] `attack_start`, `attack_scheduled`, and `attack_impact` pipeline validates and applies damage.
- [ ] Threat and combat metrics update on successful impacts.
- [ ] Duel timeout and PvP constraints are enforced.

## Technical Notes

Use `DESIGN/DETAIL/stitch-combat-and-pvp.md` for pipeline and formulas.

## Dependencies

- player-state-movement-skills
- inventory-item-stacks
