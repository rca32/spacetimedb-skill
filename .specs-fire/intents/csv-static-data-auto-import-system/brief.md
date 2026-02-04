---
id: csv-static-data-auto-import-system
title: Build CSV static data auto-import system for stitch-server
created: 2026-02-03T00:00:00Z
status: completed
completed_at: 2026-02-03T14:58:46.499Z
---

## Goal

Build an automatic CSV parsing system that loads all 14 static data files into SpacetimeDB tables when the server starts.

## Problem

Currently, stitch-server only has 15 hardcoded records in the database, while 301 data rows exist in CSV files. The `seed_data` reducer only loads sample data. We need a production-ready system that:
- Automatically parses CSV files on server startup
- Loads all 14 file types (items, quests, biomes, buildings, npcs, combat, economy)
- Validates data with referential integrity checks
- Provides detailed logging for debugging

## Users

- **Game developers**: Need reliable static data loading without manual intervention
- **Server operators**: Need visibility into data loading via logs
- **QA/Testing**: Need referential integrity to catch data errors early

## Success Criteria

- [ ] All 14 CSV files parsed automatically on server startup
- [ ] 301 data rows loaded into corresponding tables
- [ ] Rust CSV crate integrated (csv = "1.3")
- [ ] Detailed logging (INFO level for each file, ERROR for failures)
- [ ] Referential integrity checks pass:
  - food_def.item_def_id exists in item_def
  - quest rewards reference valid item_def_ids
  - item_list entries reference valid item_def_ids
  - All foreign key relationships validated
- [ ] Failed imports don't crash server (graceful degradation)
- [ ] Unit tests for CSV parsing logic

## Constraints

- Must work with SpacetimeDB lifecycle (module initialization)
- Must handle complex JSON fields in CSV (Vec structs)
- Must validate before inserting (no partial data)
- Must log to stdout for Docker/container visibility
- Must handle missing/optional fields gracefully

## Notes

**CSV Files to Parse**:
1. items/item_def.csv (50 rows)
2. items/item_list_def.csv (11 rows) - JSON complex
3. quests/quest_chain_def.csv (10 rows) - JSON complex
4. quests/quest_stage_def.csv (28 rows) - JSON complex
5. quests/achievement_def.csv (10 rows) - Vec fields
6. biomes/biome_def.csv (15 rows)
7. buildings/building_def.csv (20 rows)
8. npcs/npc_desc.csv (15 rows)
9. npcs/npc_dialogue.csv (23 rows)
10. combat/combat_action_def.csv (20 rows)
11. combat/enemy_def.csv (25 rows)
12. combat/enemy_scaling_def.csv (11 rows)
13. economy/price_index.csv (50 rows)
14. economy/economy_params.csv (15 rows)

**Tables Needing Creation** (9 new):
- biome_def, building_def, npc_desc, npc_dialogue
- combat_action_def, enemy_def, enemy_scaling_def
- price_index, economy_params

**Existing Tables** (5):
- item_def, item_list_def, quest_chain_def, quest_stage_def, achievement_def

## Work Items

1. **create-csv-parsing-service**: Create CSV parsing service module with Rust csv crate
   - Complexity: high
   - Dependencies: None
   
2. **build-csv-table-mappers**: Build CSV to table mappers for all 14 file types
   - Complexity: high
   - Dependencies: create-csv-parsing-service
   
3. **create-missing-table-definitions**: Create 9 missing table definitions for CSV data
   - Complexity: high
   - Dependencies: None
   
4. **implement-referential-integrity**: Implement referential integrity validation system
   - Complexity: medium
   - Dependencies: build-csv-table-mappers, create-missing-table-definitions
   
5. **add-detailed-logging**: Add detailed logging throughout import process
   - Complexity: low
   - Dependencies: create-csv-parsing-service
   
6. **integrate-auto-import-lifecycle**: Integrate auto-import into server startup lifecycle
   - Complexity: high
   - Dependencies: build-csv-table-mappers, implement-referential-integrity, add-detailed-logging
   
7. **write-csv-parser-unit-tests**: Write unit tests for CSV parsing logic
   - Complexity: medium
   - Dependencies: create-csv-parsing-service
   
8. **test-full-import-cycle**: Test full import cycle with all 14 CSV files
   - Complexity: high
   - Dependencies: integrate-auto-import-lifecycle, write-csv-parser-unit-tests
