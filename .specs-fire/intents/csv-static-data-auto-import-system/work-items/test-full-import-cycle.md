---
id: test-full-import-cycle
title: Test full import cycle with all 14 CSV files
intent: csv-static-data-auto-import-system
complexity: high
mode: autopilot
status: completed
depends_on:
  - integrate-auto-import-lifecycle
  - write-csv-parser-unit-tests
run_id: run-011
completed_at: 2026-02-03T15:12:39.303Z
---

## Description

Perform end-to-end testing of the complete CSV import cycle, verifying that all 14 CSV files are correctly parsed, validated, and loaded into SpacetimeDB tables. This integration test ensures the entire system works together correctly.

## Acceptance Criteria

- [ ] All 14 CSV files successfully parsed without errors
- [ ] Total of 301 data rows loaded into corresponding tables (verified via SQL/count)
- [ ] Referential integrity checks pass for all foreign key relationships
- [ ] Server starts successfully with auto-import enabled
- [ ] Data is accessible via reducers immediately after startup
- [ ] Failed import scenario tested (simulate malformed CSV, verify graceful handling)
- [ ] Import completes within reasonable time (< 30 seconds for all files)
- [ ] Logs show expected INFO/ERROR messages during import
- [ ] Data can be queried via SpacetimeDB CLI: `spacetime sql "SELECT COUNT(*) FROM item_def"`

## Implementation Notes

- This is primarily a manual/integration test, not a unit test
- Test procedure:
  1. Start with fresh SpacetimeDB instance (or clear tables)
  2. Start stitch-server with auto-import enabled
  3. Monitor logs for import progress
  4. Query each table to verify row counts match CSV files:
     - `spacetime sql "SELECT COUNT(*) FROM item_def"` → should return 50
     - Repeat for all 14 tables
  5. Test foreign key relationships:
     - `spacetime sql "SELECT * FROM food_def WHERE item_def_id NOT IN (SELECT id FROM item_def)"` → should return 0 rows
  6. Test data access from reducers:
     - Call a reducer that reads from imported tables
     - Verify data is available and correct
- Create a test script (bash or python) that automates verification:
  ```bash
  #!/bin/bash
  spacetime start
  cargo run --manifest-path stitch-server/Cargo.toml &
  sleep 5
  spacetime sql "SELECT 'item_def:', COUNT(*) FROM item_def"
  spacetime sql "SELECT 'quest_chain_def:', COUNT(*) FROM quest_chain_def"
  # ... etc for all tables
  ```
- Document any data issues found in CSV files (incorrect references, malformed JSON, etc.)
- Performance benchmark: log total import time for future optimization comparison
- Create a test report document listing:
  - CSV file name
  - Expected rows
  - Actual rows loaded
  - Any errors or warnings
  - Import time per file
