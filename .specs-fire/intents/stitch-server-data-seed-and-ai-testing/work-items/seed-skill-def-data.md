---
id: seed-skill-def-data
intent: stitch-server-data-seed-and-ai-testing
complexity: low
mode: autopilot
status: completed
depends_on: []
created: 2026-02-01T22:05:00Z
run_id: run-007
completed_at: 2026-02-01T14:21:38.518Z
---

# Work Item: Seed skill_def table with sample data

## Description

Populate the skill_def table with 5 sample skills for testing the add_skill_xp reducer.

## Acceptance Criteria

- [ ] skill_def table has 5 skill entries
- [ ] Mining: skill_id=1, max_level=100, name="Mining"
- [ ] Combat: skill_id=2, max_level=100, name="Combat"
- [ ] Crafting: skill_id=3, max_level=100, name="Crafting"
- [ ] Farming: skill_id=4, max_level=100, name="Farming"
- [ ] Trading: skill_id=5, max_level=100, name="Trading"
- [ ] AI tester query shows all 5 skills: `spacetime sql stitch-server "SELECT * FROM skill_def"`

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/init.rs` - Add data seeding

**Implementation approach:**
Use spacetimedb::init lifecycle to insert static data if tables are empty.

**AI Testing Commands:**
```bash
# Verify empty before
spacetime sql stitch-server "SELECT COUNT(*) FROM skill_def"

# After implementation
spacetime sql stitch-server "SELECT * FROM skill_def"
spacetime sql stitch-server "SELECT skill_id, name FROM skill_def WHERE skill_id = 1"
```

## Dependencies

(none)
