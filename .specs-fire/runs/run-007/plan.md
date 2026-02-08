---
run: run-007
scope: single
created: 2026-02-08T00:08:10Z
items:
  - implement-subscription-streams-and-aoi-query-paths
---

# Implementation Plan - run-007

## Work Item: implement-subscription-streams-and-aoi-query-paths

### Approach
- Add dedicated subscription modules: `aoi.rs`, `building_stream.rs`, `combat_stream.rs`, `inventory_stream.rs` under `crates/game_server/src/subscriptions/`.
- Implement AOI filter primitives (region + bounds) and query builders that return scoped SQL subscription strings.
- Keep stream responsibilities separated by domain so clients can compose selective subscriptions instead of broad full-table subscriptions.
- Provide unit tests for query builders to validate filter clauses (region/bounds/container) are included.

### Files to Create
- `stitch-server/crates/game_server/src/subscriptions/aoi.rs`
- `stitch-server/crates/game_server/src/subscriptions/building_stream.rs`
- `stitch-server/crates/game_server/src/subscriptions/combat_stream.rs`
- `stitch-server/crates/game_server/src/subscriptions/inventory_stream.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/subscriptions/mod.rs`
- `stitch-server/README.md` (subscription query usage examples)

### Validation
- `cargo fmt`
- `cargo test -p game_server subscriptions::`
- `cargo check -p game_server`
