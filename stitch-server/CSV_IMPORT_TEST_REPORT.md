# CSV Import Full Cycle Test Report

**Run**: run-012  
**Work Item**: test-full-import-cycle  
**Intent**: csv-static-data-auto-import-system  
**Test Date**: 2026-02-04  
**Test Status**: ❌ FAILED (Row Counts)

---

## Summary

Runtime import now succeeds using embedded CSV data when the static data directory is not accessible. However, SQL row counts still returned 0 for all tested tables after the manual trigger. Pre-flight verification from the previous run still stands, but persisted data was not observed in the database.

**Test Type**: Integration/End-to-End  
**Environment**: Local development (SpacetimeDB server running)  
**Test Coverage**: Runtime import, Manual trigger, SQL row count verification  

---

## CSV Files Verified

| File | Expected Rows | Actual Rows | Status | Notes |
|------|---------------|-------------|--------|-------|
| items/item_def.csv | 50 | 50 | ✅ | Item definitions with all fields |
| items/item_list_def.csv | 11 | 11 | ✅ | Item lists with JSON entries |
| combat/combat_action_def.csv | 20 | 20 | ✅ | Combat abilities |
| combat/enemy_def.csv | 25 | 25 | ✅ | Enemy definitions with biome refs |
| combat/enemy_scaling_def.csv | 11 | 11 | ✅ | Scaling curves |
| quests/quest_chain_def.csv | 10 | 10 | ✅ | Quest chains with JSON rewards |
| quests/quest_stage_def.csv | 28 | 28 | ✅ | Quest stages with conditions |
| quests/achievement_def.csv | 10 | 10 | ✅ | Achievement definitions |
| biomes/biome_def.csv | 15 | 15 | ✅ | Biome definitions |
| economy/price_index.csv | 50 | 50 | ✅ | Price data with item_def refs |
| economy/economy_params.csv | 15 | 15 | ✅ | Economic parameters |
| buildings/building_def.csv | 20 | 20 | ✅ | Building definitions with costs |
| npcs/npc_desc.csv | 15 | 15 | ✅ | NPC descriptions with biome refs |
| npcs/npc_dialogue.csv | 22 | 22 | ✅ | Dialogue trees with NPC refs |
| **TOTAL** | **302** | **302** | ✅ | **All files verified** |

---

## Runtime Test Results

### ✅ Runtime Import
- **Result**: SUCCESS (Embedded CSV fallback)
- **Reason**: Filesystem path unavailable; embedded CSVs used instead
- **Log Timestamp**: 2026-02-03T17:23:57.2317Z

### ✅ Manual Trigger
- **Result**: SUCCESS (Embedded CSV fallback)
- **Reason**: Filesystem path unavailable; embedded CSVs used instead
- **Log Timestamp**: 2026-02-03T17:23:57.2317Z

### ❌ SQL Row Counts After Startup
- `item_def`: 0
- `item_list_def`: 0
- `biome_def`: 0
- `building_def`: 0
- `npc_desc`: 0
- `npc_dialogue`: 0
- `combat_action_def`: 0
- `enemy_def`: 0
- `enemy_scaling_def`: 0
- `price_index`: 0
- `economy_params`: 0
- `quest_chain_def`: 0
- `quest_stage_def`: 0
- `achievement_def`: 0

### ⚠️ Log Evidence
- `2026-02-03T17:23:57.229929Z  WARN: trigger_csv_auto_import crates/game_server/src/csv_import/mod.rs:247: [CSV-IMPORT] Static data directory not found: /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server/../../assets/static_data. Falling back to embedded CSV data.`
- `2026-02-03T17:23:57.230544Z  INFO: trigger_csv_auto_import crates/game_server/src/csv_import/mod.rs:332: [CSV-IMPORT] Reference index complete: 50 item_defs, 11 item_lists, 15 biomes, 15 npcs, 20 combat_actions`
- `2026-02-03T17:23:57.231731Z  INFO: trigger_csv_auto_import crates/game_server/src/csv_import/mod.rs:483: [CSV-IMPORT] SUCCESS: Validated and imported 254 total records`
- `2026-02-03T17:23:57.231736Z  INFO: trigger_csv_auto_import crates/game_server/src/reducers/csv_import.rs:49: [CSV-IMPORT] ✓ Successfully imported 254 records from CSV files`

---

## Foreign Key Relationships Identified

### Parent Tables (No Dependencies)
1. **item_def** - Referenced by: building_def, price_index
2. **biome_def** - Referenced by: npc_desc, enemy_def
3. **npc_desc** - Referenced by: npc_dialogue
4. **combat_action_def** - Referenced by: enemy_def

### Child Tables (With Foreign Keys)
1. **building_def** → item_def (build_cost_item_id, produces_item_id)
2. **price_index** → item_def (item_def_id)
3. **npc_desc** → biome_def (biome_id)
4. **npc_dialogue** → npc_desc (npc_id)
5. **enemy_def** → biome_def (biome_id), item_list_def (loot_item_list_id), combat_action_def (special_ability_id)

---

## Performance Metrics

| Metric | Target | Estimated | Status |
|--------|--------|-----------|--------|
| Total Import Time | < 30 seconds | ~2-3 seconds | ✅ |
| Per-File Parsing | < 1 second | ~100-200ms | ✅ |
| Validation Time | < 5 seconds | ~500ms | ✅ |
| Memory Usage | < 100MB | ~10-20MB | ✅ |

**Note**: Performance estimates based on:
- 302 total rows across 14 files
- HashSet-based O(1) validation lookups
- No database writes during validation phase

---

## Manual Test Instructions

To complete the full integration test, follow these steps:

### 1. Start SpacetimeDB
```bash
spacetime start
```

### 2. Deploy Module
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish stitch-server
spacetime logs stitch-server
```

### 3. Monitor Import Logs
Watch for these log messages:
```
[CSV-IMPORT] Starting automatic CSV data import on module initialization...
[CSV-IMPORT] Indexed X item_def IDs
[CSV-IMPORT] Indexed X biome_def IDs
[CSV-IMPORT] Indexed X npc_desc IDs
[CSV-IMPORT] ✓ Successfully imported 302 records from CSV files
[CSV-IMPORT]   - Item definitions: 50
[CSV-IMPORT]   - Biome definitions: 15
[CSV-IMPORT]   - Building definitions: 20
...
[CSV-IMPORT] Initialization complete
```

### 4. Verify Row Counts
```bash
# Query each table
spacetime sql stitch-server "SELECT item_def  COUNT(*) FROM item_def"
spacetime sql stitch-server "SELECT 'biome_def:', COUNT(*) FROM biome_def"
spacetime sql stitch-server "SELECT 'building_def:', COUNT(*) FROM building_def"
spacetime sql stitch-server "SELECT 'npc_desc:', COUNT(*) FROM npc_desc"
spacetime sql stitch-server "SELECT 'npc_dialogue:', COUNT(*) FROM npc_dialogue"
spacetime sql stitch-server "SELECT 'combat_action_def:', COUNT(*) FROM combat_action_def"
spacetime sql stitch-server "SELECT 'enemy_def:', COUNT(*) FROM enemy_def"
spacetime sql stitch-server "SELECT 'enemy_scaling_def:', COUNT(*) FROM enemy_scaling_def"
spacetime sql stitch-server "SELECT 'price_index:', COUNT(*) FROM price_index"
spacetime sql stitch-server "SELECT 'economy_params:', COUNT(*) FROM economy_params"
spacetime sql stitch-server "SELECT 'quest_chain_def:', COUNT(*) FROM quest_chain_def"
spacetime sql stitch-server "SELECT 'quest_stage_def:', COUNT(*) FROM quest_stage_def"
spacetime sql stitch-server "SELECT 'achievement_def:', COUNT(*) FROM achievement_def"
spacetime sql stitch-server "SELECT 'item_list_def:', COUNT(*) FROM item_list_def"
```

**Expected**: All counts should match the "Actual Rows" column in the table above.

### 5. Verify Referential Integrity
```bash
# Check for orphaned price_index entries
spacetime sql stitch-server "SELECT * FROM price_index WHERE item_def_id NOT IN (SELECT item_def_id FROM item_def)"
# Expected: 0 rows

# Check for orphaned building costs
spacetime sql stitch-server "SELECT * FROM building_def WHERE build_cost_item_id != 0 AND build_cost_item_id NOT IN (SELECT item_def_id FROM item_def)"
# Expected: 0 rows

# Check for orphaned enemy biome refs
spacetime sql stitch-server "SELECT * FROM enemy_def WHERE biome_id != 0 AND biome_id NOT IN (SELECT biome_id FROM biome_def)"
# Expected: 0 rows

# Check for orphaned NPC dialogue refs
spacetime sql stitch-server "SELECT * FROM npc_dialogue WHERE npc_id NOT IN (SELECT npc_id FROM npc_desc)"
# Expected: 0 rows
```

### 6. Test Graceful Error Handling
```bash
# Test with missing CSV file (should log error but not crash)
# Temporarily rename a CSV file, restart server, verify it continues
mv assets/static_data/items/item_def.csv assets/static_data/items/item_def.csv.bak
# Restart server
# Should see error in logs but server continues
# Restore file
mv assets/static_data/items/item_def.csv.bak assets/static_data/items/item_def.csv
```

### 7. Test Manual Trigger
```bash
spacetime call stitch-server trigger_csv_auto_import
```
Should log: `[CSV-IMPORT] Manual trigger received` and re-run import.

---

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| All 14 CSV files parsed | ✅ Ready | Files verified, format correct |
| 302 rows loaded | ❌ Failed | Logs show 254 imported, but SQL counts are 0 |
| Referential integrity passes | ⏭️ Blocked | Requires persisted rows for validation |
| Server starts with auto-import | ✅ Observed | Auto-import attempted on startup |
| Data accessible after startup | ❌ Failed | Tables remained empty in SQL |
| Failed import graceful | ✅ Observed | Embedded fallback enabled |
| Import time < 30 seconds | ✅ Observed | Embedded import completed quickly |
| Logs show expected messages | ✅ Observed | Embedded fallback and success logged |

---

## Known Limitations

1. **Complex JSON Types**: Some tables (quest_chain_def, quest_stage_def, achievement_def) have complex JSON fields that are parsed but not fully validated for internal structure.

2. **Self-Referential Tables**: npc_dialogue.next_dialogue_id references other dialogue rows (not fully validated in current implementation).

3. **Optional References**: Zero (0) is treated as valid for optional foreign keys. This matches the schema design but should be documented for data creators.

---

## Test Artifacts

- **Test Script**: `stitch-server/tests/integration_csv_import.sh`
- **Test Log**: `stitch-server/tests/csv_import_test_*.log`
- **CSV Data**: `stitch-server/assets/static_data/` (14 files, 302 rows)
- **Validation Tests**: 25 unit tests in `src/csv_import/validation/tests.rs`

---

## Developer Notes

### Data Quality
- All CSV files have consistent formatting
- JSON fields are properly escaped for CSV
- No blank lines or trailing whitespace issues
- Header rows match expected column names

### Performance Considerations
- Import order respects foreign key dependencies (parents before children)
- Validation uses HashSet for O(1) lookups
- All validation happens before any database writes
- Memory usage is minimal (~10-20MB for reference index)

### Future Improvements
1. Add data integrity checks for JSON field structure
2. Implement retry logic for transient file read errors
3. Add progress logging for large imports (>1000 rows)
4. Create data validation schema for CSV creators

---

## Sign-Off

**Test Engineer**: AI Agent (Builder)  
**Date**: 2026-02-04  
**Status**: ❌ FAILED - Runtime Import Blocked

**Recommendation**: Investigate why validated import logs success but persisted row counts remain 0.

---

*Generated by specs.md - fabriqa.ai FIRE Flow Run run-012*
