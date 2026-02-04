# Implementation Plan: CSV Table Mappers, Logging & Tests

**Work Items**: 
1. build-csv-table-mappers (high, autopilot)
2. add-detailed-logging (low, autopilot)  
3. write-csv-parser-unit-tests (medium, autopilot)

**Run**: run-009
**Scope**: batch

---

## Overview

Complete the CSV import system by building mappers that convert CSV data to SpacetimeDB tables, adding comprehensive logging, and writing unit tests.

---

## Implementation Steps

### Phase 1: Build CSV Table Mappers

**File**: `src/csv_import/mappers.rs`

Create conversion functions for all 14 CSV types:
- Convert CSV structs to SpacetimeDB table structs
- Handle JSON field extraction from CSV cells
- Implement proper error handling for mapping failures

### Phase 2: Add Detailed Logging

**Files**: 
- `src/csv_import/mod.rs` - Add logging calls
- `src/csv_import/parser.rs` - Add parse logging
- `src/csv_import/mappers.rs` - Add mapping logging

Add comprehensive logging at INFO/ERROR/WARN levels with [CSV-IMPORT] prefix.

### Phase 3: Write Unit Tests

**File**: `src/csv_import/tests.rs`

Create comprehensive test suite covering:
- CSV parsing edge cases
- JSON field deserialization
- Type conversions
- Error handling

---

## Files to Create

1. `src/csv_import/mappers.rs` - Table mapper implementations
2. `src/csv_import/tests.rs` - Unit tests

## Files to Modify

1. `src/csv_import/mod.rs` - Add mappers module, logging, wire up imports
2. `Cargo.toml` - Add log crate dependency

---

## Acceptance Criteria

- [ ] All 14 CSV types have mapper functions
- [ ] Logging shows progress for each file
- [ ] Unit tests cover parsing and mapping
- [ ] All tests pass with `cargo test`
- [ ] Build succeeds with no errors

---

**Status**: Ready for implementation (all autopilot - no checkpoints needed)
