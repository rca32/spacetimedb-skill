---
id: add-threat-management-functions
intent: stitch-server-critical-gaps-implementation
complexity: low
mode: autopilot
status: pending
depends_on: [add-player-state-creation]
created: 2026-02-01T21:35:00Z
---

# Work Item: Add threat management functions

## Description

Add the missing threat management functions `add_threat` and `equalize_threat_then_add` for the combat system. These manage aggro/threat in combat encounters. Per DESIGN/DETAIL/stitch-combat-and-pvp.md Section 5.

## Acceptance Criteria

- [ ] `add_threat` function implemented in threat_calc service
- [ ] `equalize_threat_then_add` function implemented
- [ ] Functions update threat_state table
- [ ] `add_threat`: Adds threat value to target from source
- [ ] `equalize_threat_then_add`: Sets all threats to highest value then adds (for taunt)
- [ ] Updates enemy_scaling_state when threat count changes
- [ ] Used by attack_impact reducer
- [ ] Unit tests for threat calculation

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/services/threat_calc.rs`

**Function signatures:**
```rust
pub fn add_threat(
    ctx: &ReducerContext,
    source_entity_id: u64,
    target_entity_id: u64,
    base_threat: f32,
    damage: u32,
) -> Result<(), String>

pub fn equalize_threat_then_add(
    ctx: &ReducerContext,
    source_entity_id: u64,
    target_entity_id: u64,
    threat_value: f32,
) -> Result<(), String>
```

**Threat calculation:**
```
threat = base_threat + (threat_per_damage * damage)
```

**Threat table update:**
- Find or create threat_state entry
- Add calculated threat to current value
- Update enemy_scaling_state with new threat count

**Equalize logic:**
1. Find max threat value among all sources targeting same entity
2. Set this source's threat to that max value
3. Add additional threat_value

## Dependencies

- add-player-state-creation (for combat participants)
