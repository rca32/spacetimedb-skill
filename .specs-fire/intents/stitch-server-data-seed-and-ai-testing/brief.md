---
id: stitch-server-data-seed-and-ai-testing
title: Stitch server static data seeding with integrated AI testing
status: completed
created: 2026-02-01T22:00:00Z
completed_at: 2026-02-01T14:21:38.544Z
---

# Intent: Stitch server static data seeding with integrated AI testing

## Goal

Populate stitch-server database with essential static data (food definitions, skill definitions, item definitions) and ensure all data can be validated through automated AI testing. This enables complete gameplay testing and validation of all implemented systems.

## Users

- **AI Testers**: Need complete data sets to test all reducers and systems
- **Developers**: Need seeded data for integration testing
- **Game Designers**: Need baseline data to iterate on balance

## Problem

Current stitch-server implementation is complete for reducers and tables, but lacks essential static data:

1. **food_def empty** - Cannot test eat reducer without food items
2. **skill_def empty** - Cannot test add_skill_xp without skill definitions  
3. **item_def empty** - No items exist for inventory/testing
4. **inventory not auto-created** - Players have no inventory container
5. **No automated AI testing integration** - Each feature needs manual spacetime CLI testing

## Success Criteria

- [ ] food_def populated with at least 5 food items (Apple, Bread, Meat, etc.)
- [ ] skill_def populated with at least 5 skills (Mining, Combat, Crafting, etc.)
- [ ] item_def populated with items referenced by food_def and other systems
- [ ] account_bootstrap creates inventory_container for new players
- [ ] AI tester can successfully test eat reducer with real food items
- [ ] AI tester can successfully test add_skill_xp with real skills
- [ ] All new data is queryable via spacetime sql
- [ ] All systems can be tested end-to-end via spacetime call

## Constraints

- Must follow existing table schemas and relationships
- Must maintain referential integrity (food_def.item_def_id → item_def.item_def_id)
- Must use stitch-server-ai-tester skill for validation
- Must update init.rs or use reducers for data seeding
- All data additions must be testable via CLI commands

## Notes

**Static Data Requirements:**

**Food Items (food_def):**
- Apple: hp=5, stamina=0, satiation=10, item_def_id=1
- Bread: hp=10, stamina=5, satiation=20, item_def_id=2
- Meat: hp=20, stamina=10, satiation=30, item_def_id=3
- Fish: hp=15, stamina=5, satiation=25, item_def_id=4
- Potion: hp=50, stamina=50, satiation=0, item_def_id=5

**Skills (skill_def):**
- Mining: max_level=100
- Combat: max_level=100
- Crafting: max_level=100
- Farming: max_level=100
- Trading: max_level=100

**Test Validation Strategy:**
1. Query empty tables (baseline)
2. Seed data via init.rs or reducer
3. Query populated tables (verify)
4. Call reducers with real data (functional test)
5. Verify side effects (state changes)

**AI Testing Integration:**
Each work item must include AI testing commands:
- `spacetime sql stitch-server "SELECT * FROM table"`
- `spacetime call stitch-server reducer_name args`
- Verification queries after reducer calls
