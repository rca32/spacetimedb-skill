---
id: seed-item-def-data
intent: stitch-server-data-seed-and-ai-testing
complexity: low
mode: autopilot
status: completed
depends_on: []
created: 2026-02-01T22:05:00Z
run_id: run-007
completed_at: 2026-02-01T14:21:38.518Z
---

# Work Item: Seed item_def table with sample items

## Description

Populate the item_def table with items referenced by food_def and for general gameplay testing.

## Acceptance Criteria

- [ ] item_def table has at least 5 items matching food_def.item_def_id references
- [ ] Apple: item_def_id=1, item_type=3 (food), max_stack=20
- [ ] Bread: item_def_id=2, item_type=3 (food), max_stack=20
- [ ] Meat: item_def_id=3, item_type=3 (food), max_stack=10
- [ ] Fish: item_def_id=4, item_type=3 (food), max_stack=10
- [ ] Potion: item_def_id=5, item_type=3 (food), max_stack=5
- [ ] AI tester query shows all items: `spacetime sql stitch-server "SELECT * FROM item_def"`

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/init.rs` - Add data seeding

**Item types:**
- 1 = Equipment
- 2 = Tool
- 3 = Food
- 4 = Resource
- 5 = Material

**AI Testing Commands:**
```bash
# Verify empty before
spacetime sql stitch-server "SELECT COUNT(*) FROM item_def"

# After implementation
spacetime sql stitch-server "SELECT item_def_id, item_type, max_stack FROM item_def"
```

## Dependencies

(none)
