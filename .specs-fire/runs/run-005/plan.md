---
run: run-005
work_item: audit-stitch-server-stubs
intent: stitch-server-impl-gap-audit
mode: confirm
checkpoint: confirm
approved_at: null
---

# Implementation Plan: Audit stitch-server stubs and produce implementation plan

## Approach

- Use `DESIGN/DETAIL/stitch-server-folder-structure.md` to establish the expected file and module inventory.
- Scan `stitch-server/` for empty, TODO-only, or clearly stubbed files (including non-Rust assets/scripts).
- Cross-reference each gap against relevant DESIGN/DETAIL docs to capture expected behavior and ownership.
- Produce a single report with a markdown table of gaps plus a detailed, per-file checklist ordered by dependencies.

## Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/docs/implementation-gap-audit.md` | Gap audit table and per-file implementation checklist |

## Files to Modify

| File | Changes |
|------|---------|
| (none) | |

## Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo test -p game_server --tests` (document-only change, sanity run) |

## Technical Details

- Use `rg "TODO|TODO\(|UNIMPLEMENTED|unimplemented!|panic!\(\"TODO\"" stitch-server` to locate obvious stubs.
- Treat empty modules, placeholder comments, and clearly unimplemented reducers/services as gaps.
- For each gap, record: file path, stub signal, referenced DESIGN/DETAIL source(s), expected behavior summary, and dependency notes.

---
Approve plan? [Y/n/edit]

---

## Work Item: build-and-publish-stitch-server

### Approach

- Run `spacetime build` for the stitch-server module using the default CLI profile.
- Run `spacetime publish` for the same module and capture output for summary.

### Files to Create

| File | Purpose |
|------|---------|
| (none) | |

### Files to Modify

| File | Changes |
|------|---------|
| (none) | |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` module | `spacetime build` (build validation) |

---
Approve plan? [Y/n/edit]
