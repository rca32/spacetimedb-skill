---
id: create-csv-parsing-service
title: Create CSV parsing service module with Rust csv crate
intent: csv-static-data-auto-import-system
complexity: high
mode: autopilot
status: completed
depends_on: []
run_id: run-008
completed_at: 2026-02-02T15:28:31.235Z
---

## Description

Create a core CSV parsing service module that will handle reading and parsing all 14 CSV files using the Rust csv crate (csv = "1.3"). This module serves as the foundation for the entire auto-import system and must handle various CSV formats including complex JSON fields and Vec structs embedded in CSV cells.

## Acceptance Criteria

- [ ] CSV crate (csv = "1.3") added to Cargo.toml dependencies
- [ ] Service module created in src/csv_import/ directory
- [ ] Generic CSV reader function that handles any CSV file type
- [ ] Support for custom deserialization of JSON fields within CSV
- [ ] Error handling with detailed error messages for malformed CSV
- [ ] Handles headers with potential BOM (Byte Order Mark)

## Implementation Notes

- Create src/csv_import/mod.rs as the main entry point
- Implement a generic `parse_csv_file<T: DeserializeOwned>(path: &str) -> Result<Vec<T>, CsvError>` function
- Use csv::ReaderBuilder for flexible configuration
- Handle both simple scalar fields and complex nested JSON structures
- Consider using serde_json for deserializing JSON fields within CSV cells
- Ensure UTF-8 encoding support for international characters
