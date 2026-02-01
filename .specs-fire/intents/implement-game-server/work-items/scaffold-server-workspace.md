---
id: scaffold-server-workspace
title: Server workspace scaffolding
intent: implement-game-server
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-01-31T18:02:07.670Z
---

# Work Item: Server workspace scaffolding

## Description

Create the `stitch-server/` workspace, cargo crates, and module entry points aligned with DESIGN/DETAIL folder structure.

## Acceptance Criteria

- [ ] `stitch-server/` matches the top-level folder layout in DESIGN/DETAIL.
- [ ] `crates/game_server`, `crates/shared_types`, `crates/data_loader` compile as a workspace.
- [ ] `game_server` has `lib.rs`, `module.rs`, and `init.rs` wired.
- [ ] Config skeletons exist (`config/mod.rs`, `build_info.rs`, `feature_flags.rs`).

## Technical Notes

Follow `DESIGN/DETAIL/stitch-server-folder-structure.md` exactly for paths and module boundaries.

## Dependencies

(none)
