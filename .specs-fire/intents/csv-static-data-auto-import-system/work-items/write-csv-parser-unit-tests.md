---
id: write-csv-parser-unit-tests
title: Write unit tests for CSV parsing logic
intent: csv-static-data-auto-import-system
complexity: medium
mode: autopilot
status: completed
depends_on:
  - create-csv-parsing-service
run_id: run-009
completed_at: 2026-02-03T10:35:51.295Z
---

## Description

Write comprehensive unit tests for the CSV parsing service to ensure it correctly handles various CSV formats, edge cases, and error conditions. Tests should cover the generic parsing logic as well as specific mapper implementations.

## Acceptance Criteria

- [ ] Unit tests for generic CSV reader (valid file, empty file, malformed CSV)
- [ ] Unit tests for JSON field deserialization within CSV cells
- [ ] Unit tests for Vec field parsing (achievement_def.csv style)
- [ ] Unit tests for type conversion (string to int, string to bool, etc.)
- [ ] Unit tests for optional/missing field handling
- [ ] Unit tests for error propagation and error message quality
- [ ] Test coverage for at least 3 different CSV file types (simple, JSON complex, Vec fields)
- [ ] Tests use mock CSV data (no dependency on actual CSV files)
- [ ] All tests pass with `cargo test`

## Implementation Notes

- Create src/csv_import/tests.rs module
- Use `#[cfg(test)]` modules for test organization
- Test utilities:
  - `create_test_csv(content: &str) -> tempfile::NamedTempFile` helper
  - Mock CSV data stored as string constants in tests
- Test cases to include:
  - Happy path: valid CSV with all fields
  - Empty CSV (headers only)
  - Missing optional fields
  - JSON parsing: `{"key": "value"}` in a cell
  - Vec parsing: `[1, 2, 3]` or JSON array format
  - Type errors: non-numeric string in integer field
  - Extra columns in CSV (should be ignored)
  - Missing columns (should error or use default)
- Example test structure:
  ```rust
  #[test]
  fn test_parse_item_def_csv() {
      let csv = "id,name,description\n1,Sword,A sharp blade";
      let items = parse_csv::<ItemDef>(csv).unwrap();
      assert_eq!(items.len(), 1);
      assert_eq!(items[0].name, "Sword");
  }
  ```
- Consider using `pretty_assertions` crate for better test failure messages
