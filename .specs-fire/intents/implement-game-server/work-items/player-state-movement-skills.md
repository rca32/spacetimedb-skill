---
id: player-state-movement-skills
title: Player state, movement, skills, and abilities
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - auth-session-system
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T00:40:32.597Z
---

# Work Item: Player state, movement, skills, and abilities

## Description

Implement player state tables, movement validation, stat aggregation, skill XP, and ability usage reducers.

## Acceptance Criteria

- [ ] Tables for player/transform/action/exploration/resource/character_stats exist and are wired.
- [ ] `move_player` validates coordinates, stamina, obstacles, and updates exploration.
- [ ] `collect_stats` aggregates equipment/buff/knowledge and clamps final stats.
- [ ] `add_skill_xp` and `use_ability` reducers follow cooldown/resource rules.

## Technical Notes

Follow `DESIGN/DETAIL/player-state-management.md` for schemas, reducers, and RLS views.

## Dependencies

- auth-session-system
