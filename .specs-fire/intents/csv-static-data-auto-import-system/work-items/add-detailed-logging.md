---
id: add-detailed-logging
title: Add detailed logging throughout import process
intent: csv-static-data-auto-import-system
complexity: low
mode: autopilot
status: completed
depends_on:
  - create-csv-parsing-service
run_id: run-009
completed_at: 2026-02-03T10:35:51.295Z
---

## Description

Add comprehensive logging throughout the CSV import process to provide visibility into data loading progress, errors, and statistics. Logs must be output to stdout for Docker/container compatibility.

## Acceptance Criteria

- [ ] INFO level log for each CSV file being processed (filename, row count)
- [ ] INFO level log when a file is successfully loaded (table name, rows inserted)
- [ ] ERROR level log for any CSV parsing failures with file name and line number
- [ ] ERROR level log for referential integrity validation failures
- [ ] WARN level log for skipped rows (if applicable)
- [ ] Summary log at end showing total files processed, total rows loaded, any errors
- [ ] All logs output to stdout (not stderr) for container visibility
- [ ] Progress indication for large files (optional but helpful)

## Implementation Notes

- Use Rust's standard `log` crate with appropriate macros: `info!`, `error!`, `warn!`
- Add a logging setup in the CSV import service initialization
- Format: `[CSV-IMPORT] {LEVEL}: {message}` for easy filtering
- Log examples:
  - `info!("[CSV-IMPORT] Processing: items/item_def.csv (expected 50 rows)");`
  - `info!("[CSV-IMPORT] Loaded: item_def table with 50 rows");`
  - `error!("[CSV-IMPORT] Failed: items/item_def.csv row 23: Invalid integer in 'damage' field");`
- Consider adding a CSVImportLogger struct that wraps logging with context (current file, current phase)
- Ensure logging doesn't significantly slow down the import process
- Include timing information: `info!("[CSV-IMPORT] Completed in 145ms");`
