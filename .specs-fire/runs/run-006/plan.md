---
run: run-006
scope: single
created: 2026-02-07T23:43:30Z
items:
  - build-static-data-loader-and-asset-pipeline
---

# Implementation Plan - run-006

## Work Item: build-static-data-loader-and-asset-pipeline

### Approach
- Add a new `crates/data_loader` crate and connect it to `game_server`.
- Create design-aligned static data assets under `stitch-server/assets/static_data/{items,buildings,combat,quests}`.
- Implement CSV schema parsing + validation for `item/building/combat/quest` in `data_loader` so malformed rows are rejected before DB writes.
- Add static definition tables in `game_server` for building/combat/quest and wire `import_csv_data` / `import_csv_by_type` reducers to load validated rows into tables idempotently.

### Files to Create
- `stitch-server/crates/data_loader/Cargo.toml`
- `stitch-server/crates/data_loader/src/lib.rs`
- `stitch-server/crates/game_server/src/tables/static_data.rs`
- `stitch-server/assets/static_data/items/item_def.csv`
- `stitch-server/assets/static_data/buildings/building_def.csv`
- `stitch-server/assets/static_data/combat/combat_action_def.csv`
- `stitch-server/assets/static_data/quests/quest_chain_def.csv`

### Files to Modify
- `stitch-server/Cargo.toml`
- `stitch-server/crates/game_server/Cargo.toml`
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/lib.rs`
- `stitch-server/README.md`

### Validation
- `cargo fmt`
- `cargo test -p data_loader`
- `cargo check -p game_server`
