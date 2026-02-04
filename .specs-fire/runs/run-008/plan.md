# Implementation Plan: Create CSV Parsing Service

**Work Item**: create-csv-parsing-service  
**Run**: run-008  
**Mode**: confirm (1 checkpoint)  
**Complexity**: high

---

## Overview

Create a core CSV parsing service module using the Rust csv crate to handle reading and parsing all 14 static data CSV files. This module will serve as the foundation for the auto-import system.

---

## Implementation Steps

### Step 1: Add CSV Crate Dependency

**File**: `stitch-server/crates/game_server/Cargo.toml`

Add the csv crate to dependencies:
```toml
[dependencies]
spacetimedb = "1.0.0"
csv = "1.3"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

---

### Step 2: Create CSV Import Module Structure

**Directory**: `stitch-server/crates/game_server/src/csv_import/`

Create module files:
- `mod.rs` - Main entry point with public API
- `parser.rs` - Core CSV parsing logic
- `error.rs` - Error types and handling
- `models.rs` - CSV record structs for all 14 file types

---

### Step 3: Implement Error Handling

**File**: `stitch-server/crates/game_server/src/csv_import/error.rs`

Define error types:
```rust
#[derive(Debug)]
pub enum CsvImportError {
    IoError(std::io::Error),
    CsvError(csv::Error),
    JsonError(serde_json::Error),
    ValidationError(String),
    MissingFile(String),
}
```

---

### Step 4: Implement Core Parser

**File**: `stitch-server/crates/game_server/src/csv_import/parser.rs`

Implement generic CSV reader:
```rust
pub fn parse_csv_file<T: DeserializeOwned>(
    path: &str
) -> Result<Vec<T>, CsvImportError> {
    // Handle BOM
    // Use ReaderBuilder for flexibility
    // Deserialize records
}
```

---

### Step 5: Define CSV Record Models

**File**: `stitch-server/crates/game_server/src/csv_import/models.rs`

Define structs for each CSV type with proper serde attributes for JSON fields.

---

### Step 6: Wire Up Module

**File**: `stitch-server/crates/game_server/src/lib.rs`

Add module declaration:
```rust
pub mod csv_import;
```

---

## Files to Create

1. `stitch-server/crates/game_server/src/csv_import/mod.rs`
2. `stitch-server/crates/game_server/src/csv_import/parser.rs`
3. `stitch-server/crates/game_server/src/csv_import/error.rs`
4. `stitch-server/crates/game_server/src/csv_import/models.rs`

## Files to Modify

1. `stitch-server/crates/game_server/Cargo.toml` - Add dependencies
2. `stitch-server/crates/game_server/src/lib.rs` - Add module

## Acceptance Criteria Checklist

- [ ] CSV crate (csv = "1.3") added to Cargo.toml
- [ ] Service module created in src/csv_import/
- [ ] Generic CSV reader function implemented
- [ ] Support for JSON field deserialization
- [ ] Error handling with detailed messages
- [ ] BOM handling for UTF-8 files

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| CSV with complex JSON fields | Use custom deserializer with serde_json |
| File encoding issues | Handle BOM, enforce UTF-8 |
| Large file memory usage | Stream processing if needed |

---

**Checkpoint**: Please review this plan. Proceed with implementation? [Y/n/edit]
