---
id: complete-add-skill-xp-reducer
intent: stitch-server-critical-gaps-implementation
complexity: medium
mode: confirm
status: in_progress
depends_on:
  - add-player-state-creation
created: 2026-02-01T21:35:00Z
---

# Work Item: Complete add_skill_xp reducer

## Description

Complete the `add_skill_xp` reducer implementation. Currently it's a stub in the skill module. Per DESIGN/DETAIL/player-state-management.md for skill progression.

This reducer adds XP to a specific skill for a player, potentially triggering level ups and unlocking new abilities.

## Acceptance Criteria

- [ ] `add_skill_xp` reducer fully implemented
- [ ] Parameters: skill_id, xp_amount
- [ ] Finds or creates skill_progress entry for player + skill
- [ ] Adds XP to current total
- [ ] Checks if skill level up threshold reached
- [ ] Updates skill level if threshold passed
- [ ] Unlocks new abilities when skill reaches certain levels
- [ ] Updates player_state.level based on total skill levels
- [ ] Creates achievement if first time reaching skill level milestone
- [ ] Returns error for invalid skill_id or negative xp_amount

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/reducers/skill/add_skill_xp.rs`

**Tables involved:**
- `skill_progress` - tracks XP and level per skill
- `skill_def` - skill definitions including XP thresholds
- `player_state` - player level needs recalculation
- `ability_def` - abilities unlocked by skills
- `ability_state` - grant new abilities on level up

**Level up logic:**
- Each skill has XP thresholds per level
- Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP, etc.
- Player level = sum of all skill levels / number_of_skills

**Unlocks:**
- New abilities at skill levels 5, 10, 20, etc.
- Check ability_def.skill_requirements

## Dependencies

- add-player-state-creation (needs player to exist)
