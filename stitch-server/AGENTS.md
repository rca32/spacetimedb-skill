# AGENTS Guide (Stitch Server)

## Overview

This workspace contains the server-side SpacetimeDB module and supporting crates.
Follow the design documents in `DESIGN/DETAIL` as the source of truth.

## Conventions

- Tables live in `crates/game_server/src/tables/` and are exported in `tables/mod.rs`.
- Reducers live in `crates/game_server/src/reducers/` and are wired in `reducers/mod.rs`.
- Agent loops live in `crates/game_server/src/agents/` and are wired in `agents/mod.rs`.
- Services live in `crates/game_server/src/services/` and are wired in `services/mod.rs`.

## Safety and Consistency

- Keep reducer signatures `fn(&ReducerContext, ...) -> Result<(), String>`.
- Avoid naming reducers the same as tables to prevent macro symbol conflicts.
- Prefer `ctx.db.table().insert(row)` for new rows and `ctx.db.table().pk().update(row)` for updates.

## Tests

- Unit and integration test scaffolding lives in `crates/game_server/tests/`.
- Fixtures are in `tests/fixtures/`.
- Use `cargo test -p game_server --tests` for the full test run.
