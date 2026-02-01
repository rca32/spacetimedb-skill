---
id: create-food-def-table
intent: stitch-server-critical-gaps-implementation
complexity: low
mode: autopilot
status: completed
depends_on: []
created: 2026-02-01T21:35:00Z
run_id: run-006
completed_at: 2026-02-01T13:01:24.990Z
---

# Work Item: Create food_def table and static data

## Description

Create the `food_def` table to define food item properties including HP restore, stamina restore, and satiation restore values. Per DESIGN/DETAIL/player-regeneration-system.md Section 2.5.

This is a static data table (like item_def) that defines what each food item does when consumed.

## Acceptance Criteria

- [ ] `food_def` table created with proper fields
- [ ] Table fields: food_id, item_def_id, hp_restore, stamina_restore, satiation_restore, buff_ids (optional)
- [ ] At least 3 sample food definitions added (e.g., Apple, Bread, Meat)
- [ ] Static data loaded via data_loader or hardcoded in init
- [ ] Food items reference existing item_def entries
- [ ] AI tester can query food_def table and see definitions

## Technical Notes

**Files to create/modify:**
- `stitch-server/crates/game_server/src/tables/food_def.rs` (new file)
- `stitch-server/crates/game_server/src/tables/mod.rs` (add export)
- `stitch-server/crates/game_server/src/init.rs` (add sample data)

**Table structure:**
```rust
#[spacetimedb::table(name = food_def, public)]
pub struct FoodDef {
    #[primary_key]
    pub food_id: u32,
    pub item_def_id: u64,  // References item_def
    pub hp_restore: i32,
    pub stamina_restore: i32,
    pub satiation_restore: i32,
    pub buff_ids: Vec<u32>,  // Optional buffs applied
}
```

**Sample data:**
- Apple: item_def_id=1, hp=5, stamina=0, satiation=10
- Bread: item_def_id=2, hp=10, stamina=5, satiation=20
- Meat: item_def_id=3, hp=20, stamina=10, satiation=30

## Dependencies

(none)
