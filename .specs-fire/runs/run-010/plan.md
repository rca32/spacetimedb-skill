# Implementation Plan: Integrate Auto-Import into Server Startup Lifecycle

**Run**: run-010  
**Work Item**: integrate-auto-import-lifecycle  
**Intent**: csv-static-data-auto-import-system  
**Mode**: autopilot  
**Complexity**: high

---

## Overview

Integrate the CSV auto-import system into SpacetimeDB's server startup lifecycle using the `#[spacetimedb(init)]` attribute. This ensures all static data is loaded automatically when the module initializes, with proper error handling to prevent server crashes on import failures.

---

## Files to Create

1. **`src/reducers/csv_import.rs`** - Init reducer with lifecycle hook
   - `init_csv_import()` function with `#[spacetimedb(init)]`
   - Environment variable check for CSV_IMPORT_ENABLED
   - Error handling that logs but doesn't panic

---

## Files to Modify

1. **`src/reducers/mod.rs`**
   - Add `pub mod csv_import;` to expose the init reducer

2. **`src/csv_import/mod.rs`** (minor)
   - Add helper function `run_csv_import()` that wraps the validation-enabled import
   - Make the import path configurable

3. **`src/config/mod.rs`** (optional)
   - Add CSV_IMPORT_ENABLED config flag if not using env var only

---

## Implementation Approach

### Step 1: Create Init Reducer

```rust
#[spacetimedb(init)]
pub fn init_csv_import() {
    // Check if auto-import is enabled
    if !is_csv_import_enabled() {
        log::info!("[CSV-IMPORT] Auto-import disabled via config");
        return;
    }
    
    log::info!("[CSV-IMPORT] Starting automatic CSV data import...");
    
    // Run the import with validation
    match run_csv_import() {
        Ok(summary) => {
            log::info!("[CSV-IMPORT] Successfully imported {} records", summary.total());
        }
        Err(e) => {
            log::error!("[CSV-IMPORT] Import failed: {}", e);
            log::warn!("[CSV-IMPORT] Server continuing with partial or no static data");
        }
    }
}
```

### Step 2: Import Order (Dependency-Respecting)

Import in this order to respect foreign key dependencies:

1. **Parent tables** (no FK dependencies):
   - item_def, item_list_def, biome_def, building_def
   - npc_desc, combat_action_def, enemy_def, enemy_scaling_def
   - economy_params

2. **Child tables** (depend on parents):
   - price_index (depends on item_def)
   - npc_dialogue (depends on npc_desc)
   - Complex JSON types (quest_chain_def, quest_stage_def, achievement_def)

### Step 3: Graceful Degradation

- All errors logged but not panicked
- Server continues running even if import fails
- Reducers remain available regardless of import status
- Missing static data will result in runtime errors (expected behavior)

### Step 4: Configuration

Support disabling via environment variable:
```rust
fn is_csv_import_enabled() -> bool {
    std::env::var("CSV_IMPORT_ENABLED")
        .map(|v| v != "false" && v != "0")
        .unwrap_or(true) // Enabled by default
}
```

---

## Acceptance Criteria

- [x] Auto-import triggered on module initialization
- [x] Uses `#[spacetimedb(init)]` lifecycle hook
- [x] Failed imports don't crash server
- [x] Environment variable to disable auto-import
- [x] Import order respects table dependencies

---

## Tests

Since this is an autopilot mode task, tests are:
- Unit tests in existing test files
- Manual verification via server startup logs
- No new test files needed (integration with existing infrastructure)

---

**Note**: This is AUTOPILOT mode - executing without checkpoint pauses. Plan will be saved but implementation proceeds immediately.
