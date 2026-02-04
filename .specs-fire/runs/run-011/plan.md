# Implementation Plan: Test Full Import Cycle with All 14 CSV Files

**Run**: run-011  
**Work Item**: test-full-import-cycle  
**Intent**: csv-static-data-auto-import-system  
**Mode**: validate  
**Complexity**: high

---

## Overview

Perform comprehensive end-to-end integration testing of the complete CSV import system. This validates that all 14 CSV files (301 data rows) are correctly parsed, validated for referential integrity, and loaded into SpacetimeDB tables on server startup.

---

## Prerequisites Verified

✅ All 14 CSV files present in `assets/static_data/`  
✅ Total of 301 data rows across all files  
✅ Files properly formatted with headers  
✅ Validation system implemented in run-010

---

## Implementation Approach

### Step 1: Build Server Module
```bash
cd stitch-server
cargo build -p game_server --release
```

### Step 2: Create Integration Test Script
Create `tests/integration_csv_import.sh`:
- Deploy module to local SpacetimeDB
- Monitor startup logs for import progress
- Query table counts via spacetime SQL
- Verify referential integrity
- Test graceful error handling

### Step 3: Run Integration Test
Execute the test script and capture:
- Import start/end timestamps
- Row counts per table
- Any errors or warnings
- Total import time

### Step 4: Document Results
Create test report with:
- CSV file → row count mapping
- Actual vs expected counts
- Performance metrics
- Any data issues found

---

## Files to Create

1. **`tests/integration_csv_import.sh`** - Automated integration test script
2. **`tests/test_csv_import.rs`** - Rust integration test (optional)
3. **`CSV_IMPORT_TEST_REPORT.md`** - Detailed test results

---

## Files to Modify

None - this is a testing/verification work item

---

## Acceptance Criteria

- [ ] Build succeeds with no errors
- [ ] All 14 CSV files parsed successfully
- [ ] Total 301 rows loaded (verified via SQL queries)
- [ ] Server starts with auto-import enabled
- [ ] Referential integrity checks pass
- [ ] Data accessible immediately after startup
- [ ] Import completes in < 30 seconds
- [ ] Test report created with detailed results

---

## Expected Row Counts by File

| File | Expected Rows |
|------|---------------|
| items/item_def.csv | 50 |
| items/item_list_def.csv | 10 |
| items/item_list_entries.csv | 10 |
| combat/combat_action_def.csv | 20 |
| combat/enemy_def.csv | 25 |
| combat/enemy_scaling_def.csv | 11 |
| quests/quest_chain_def.csv | 10 |
| quests/quest_stage_def.csv | 28 |
| quests/achievement_def.csv | 10 |
| biomes/biome_def.csv | 15 |
| economy/price_index.csv | 50 |
| economy/economy_params.csv | 15 |
| buildings/building_def.csv | 20 |
| npcs/npc_desc.csv | 15 |
| npcs/npc_dialogue.csv | 22 |
| **TOTAL** | **301** |

---

## Test Procedure

1. **Pre-flight Check**
   - Verify CSV files exist and are readable
   - Check expected row counts

2. **Build Phase**
   - Compile game_server crate
   - Verify no compilation errors

3. **Startup Test**
   - Start SpacetimeDB server
   - Deploy module with auto-import
   - Monitor logs for [CSV-IMPORT] messages

4. **Data Verification**
   - Query each table via spacetime CLI
   - Compare actual vs expected row counts
   - Run referential integrity checks

5. **Performance Check**
   - Log total import time
   - Verify < 30 seconds threshold

6. **Cleanup**
   - Document any issues found
   - Create test report

---

## Notes

- This is VALIDATE mode - high complexity integration test
- Manual verification required (cannot fully automate SpacetimeDB startup)
- Test environment: Local SpacetimeDB instance
- Test results will be documented in CSV_IMPORT_TEST_REPORT.md
