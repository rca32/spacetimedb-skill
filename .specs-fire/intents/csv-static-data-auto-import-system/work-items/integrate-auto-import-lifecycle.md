---
id: integrate-auto-import-lifecycle
title: Integrate auto-import into server startup lifecycle
intent: csv-static-data-auto-import-system
complexity: high
mode: autopilot
status: completed
depends_on:
  - build-csv-table-mappers
  - implement-referential-integrity
  - add-detailed-logging
run_id: run-010
completed_at: 2026-02-03T14:58:25.008Z
---

## Description

Integrate the CSV auto-import system into SpacetimeDB's server startup lifecycle so that all CSV files are automatically parsed and loaded when the server module initializes. The integration must work with SpacetimeDB's module initialization hooks and ensure failed imports don't crash the server.

## Acceptance Criteria

- [ ] Auto-import triggered automatically on server startup/module init
- [ ] Uses SpacetimedDB lifecycle hooks (module initialization callback)
- [ ] CSV files loaded before reducers become available (if order matters)
- [ ] Failed imports don't crash server (graceful degradation)
- [ ] If import fails, server continues running with available data
- [ ] Environment variable or config flag to disable auto-import (optional but useful)
- [ ] Import order respects table dependencies (parent tables before child tables)

## Implementation Notes

- Research SpacetimeDB module lifecycle hooks (likely `#[spacetimedb(init)]` reducers)
- Create an initialization function: `fn init_csv_import()` marked with `#[spacetimedb(init)]`
- Implementation approach:
  ```rust
  #[spacetimedb(init)]
  pub fn init_csv_import() {
      log::info!("[CSV-IMPORT] Starting automatic CSV data import...");
      if let Err(e) = run_csv_import() {
          log::error!("[CSV-IMPORT] Import failed (continuing anyway): {}", e);
      }
  }
  ```
- Order CSV imports by dependency:
  1. item_def (parent of many)
  2. quest_chain_def, biome_def, building_def, etc.
  3. item_list_def, quest_stage_def, food_def (depend on item_def)
- Create a CSV_IMPORT_ENABLED config flag (check env var or spacetime config)
- If import fails, log the error but don't panic - server should remain operational
- Consider adding a retry mechanism for transient failures
- Test that reducers can access imported data immediately after init
