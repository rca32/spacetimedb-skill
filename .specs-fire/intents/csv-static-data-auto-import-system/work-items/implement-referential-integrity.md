---
id: implement-referential-integrity
title: Implement referential integrity validation system
intent: csv-static-data-auto-import-system
complexity: medium
mode: autopilot
status: completed
depends_on:
  - build-csv-table-mappers
  - create-missing-table-definitions
run_id: run-010
completed_at: 2026-02-03T14:54:28.075Z
---

## Description

Implement a referential integrity validation system that checks all foreign key relationships before inserting data. The system must validate that referenced IDs exist in their parent tables and prevent partial data insertion if any validation fails.

## Acceptance Criteria

- [ ] Validation that `food_def.item_def_id` exists in `item_def` table
- [ ] Validation that quest rewards reference valid `item_def_id`s
- [ ] Validation that `item_list` entries reference valid `item_def_id`s
- [ ] Validation system checks all foreign key relationships before any inserts
- [ ] Failed validation provides specific error message (which file, which row, which reference failed)
- [ ] No partial data inserted if any validation fails for a file
- [ ] All 14 CSV file types validated for their specific relationships

## Implementation Notes

- Create src/csv_import/validation.rs module
- Build a validation runner that executes before the import phase
- Maintain an in-memory map of all valid IDs for each referenced table during validation
- Implement a `ReferentialIntegrityValidator` trait with methods like `validate_item_def_id(id: u32) -> Result<(), ValidationError>`
- Validation should happen in two phases:
  1. Build reference index: Scan all parent tables (item_def, etc.) and collect valid IDs
  2. Validate children: Check all foreign keys against the reference index
- Use a builder pattern: `Validator::new().add_item_def_ids().validate_food_defs()`
- Store validation results with file name, row number, and specific error for debugging
