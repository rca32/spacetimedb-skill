---
id: implement-eat-reducer-food-system
intent: stitch-server-critical-gaps-implementation
complexity: medium
mode: confirm
status: in_progress
depends_on:
  - create-food-def-table
  - add-player-state-creation
created: 2026-02-01T21:35:00Z
---

# Work Item: Implement eat reducer and food system

## Description

Implement the `eat` reducer that allows players to consume food items to recover HP, stamina, and satiation. This is currently an empty stub in `reducers/player/eat.rs` and is blocking the core gameplay loop.

Per DESIGN/DETAIL/player-regeneration-system.md Section 4.1:
- Validate player has food item in inventory
- Apply food effects (hp_restore, stamina_restore, satiation_restore)
- Remove consumed item from inventory
- Remove starvation debuff if satiation increases above threshold
- Update resource_state table

## Acceptance Criteria

- [ ] `eat` reducer accepts food item instance ID as parameter
- [ ] Validates food exists in player inventory
- [ ] Validates food is not expired/spoiled (if applicable)
- [ ] Applies HP recovery based on food_def.hp_restore
- [ ] Applies stamina recovery based on food_def.stamina_restore
- [ ] Applies satiation increase based on food_def.satiation_restore
- [ ] Removes consumed item from inventory
- [ ] Updates resource_state table with new values
- [ ] Removes starvation debuff from starving_state table if satiation > 0
- [ ] Returns appropriate error if player has no food, food not found, or player is dead
- [ ] AI tester can successfully test food consumption via spacetime call

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/reducers/player/eat.rs` (currently empty stub)

**Files that must exist first:**
- `stitch-server/crates/game_server/src/tables/food_def.rs` (see dependency work item)
- `stitch-server/crates/game_server/src/tables/starving_state.rs` (may need to create)

**Reducer signature:**
```rust
pub fn eat(ctx: &ReducerContext, item_instance_id: u64) -> Result<(), String>
```

**Dependencies on other tables:**
- `inventory_slot` - to find food item
- `item_instance` - to get item_def_id
- `food_def` - to get restore values
- `resource_state` - to update HP/stamina/satiation
- `starving_state` - to remove starvation debuff

## Dependencies

- create-food-def-table (needs food definitions)
- add-player-state-creation (needs player to exist)
