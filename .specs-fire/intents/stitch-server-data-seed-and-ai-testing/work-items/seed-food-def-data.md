---
id: seed-food-def-data
intent: stitch-server-data-seed-and-ai-testing
complexity: low
mode: autopilot
status: completed
depends_on: []
created: 2026-02-01T22:05:00Z
run_id: run-007
completed_at: 2026-02-01T14:21:38.518Z
---

# Work Item: Seed food_def table with sample data

## Description

Populate the food_def table with 5 sample food items for testing the eat reducer.

## Acceptance Criteria

- [ ] food_def table has 5 food entries
- [ ] Apple: food_id=1, item_def_id=1, hp=5, stamina=0, satiation=10
- [ ] Bread: food_id=2, item_def_id=2, hp=10, stamina=5, satiation=20
- [ ] Meat: food_id=3, item_def_id=3, hp=20, stamina=10, satiation=30
- [ ] Fish: food_id=4, item_def_id=4, hp=15, stamina=5, satiation=25
- [ ] Potion: food_id=5, item_def_id=5, hp=50, stamina=50, satiation=0
- [ ] AI tester query shows all 5 foods: `spacetime sql stitch-server "SELECT * FROM food_def"`

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/init.rs` - Add data seeding

**Implementation approach:**
Use spacetimedb::init lifecycle to insert static data if tables are empty.

**AI Testing Commands:**
```bash
# Verify empty before
spacetime sql stitch-server "SELECT COUNT(*) FROM food_def"

# After implementation
spacetime sql stitch-server "SELECT * FROM food_def"
spacetime sql stitch-server "SELECT food_id, item_def_id, hp_restore FROM food_def WHERE food_id = 1"
```

## Dependencies

(none)
