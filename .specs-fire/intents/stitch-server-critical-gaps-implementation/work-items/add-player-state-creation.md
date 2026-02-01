---
id: add-player-state-creation
intent: stitch-server-critical-gaps-implementation
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-02-01T21:35:00Z
run_id: run-006
completed_at: 2026-02-01T12:58:46.654Z
---

# Work Item: Add player_state creation to auth flow

## Description

Currently `account_bootstrap` creates `account` and `account_profile` but does NOT create the player entity and associated state tables. This blocks all player-related reducers (move_player, use_ability, etc.) which require `player_state`, `transform_state`, `resource_state`, and `character_stats`.

Per DESIGN/DETAIL/player-state-management.md and stitch-authentication-authorization.md:
- On account_bootstrap or sign_in, create player entity if it doesn't exist
- Create all required player state tables with initial values
- Set initial position, resources (HP/stamina/satiation), and stats

## Acceptance Criteria

- [ ] `account_bootstrap` reducer creates player_state entry if missing
- [ ] Creates transform_state with initial position (hex_x=100, hex_z=100, dimension=0)
- [ ] Creates resource_state with initial HP=100, stamina=100, satiation=100
- [ ] Creates character_stats with base values (max_hp=100, regen_rates, etc.)
- [ ] Creates exploration_state with empty explored_chunks
- [ ] Assigns unique entity_id (using ctx.random())
- [ ] Links player_state.identity to account.identity
- [ ] Sets initial level=1, region_id=1
- [ ] AI tester can query player_state after bootstrap and see created player
- [ ] move_player reducer works after bootstrap (previously failed with "Player not found")

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/reducers/auth/account_bootstrap.rs`

**Alternative approach:**
Could also create player in `sign_in` reducer, but bootstrap is more appropriate for first-time setup.

**Tables to populate:**
- `player_state` - core player identity
- `transform_state` - position and rotation
- `resource_state` - HP, stamina, satiation
- `character_stats` - max values and regen rates
- `exploration_state` - discovered chunks
- `action_state` - current action (idle)

**Initial values per DESIGN:**
- Position: hex_x=100, hex_z=100 (spawn point)
- HP: 100/100 (full health)
- Stamina: 100/100
- Satiation: 100/100
- Level: 1

## Dependencies

(none)
