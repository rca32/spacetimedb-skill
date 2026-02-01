---
id: worldgen-terrain-pathfinding
title: World generation, terrain, and pathfinding
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - scaffold-server-workspace
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T00:31:23.958Z
---

# Work Item: World generation, terrain, and pathfinding

## Description

Implement hex coordinate system, terrain/resource tables, world generation reducers, harvesting, and pathfinding services.

## Acceptance Criteria

- [ ] Hex coordinate utilities and chunk indexing follow design rules.
- [ ] Terrain/resource tables and world-gen params exist and loadable.
- [ ] `generate_world` and `get_chunk_data` reducers produce deterministic chunks.
- [ ] Pathfinding data and services support movement/NPC usage.

## Technical Notes

Reference `DESIGN/DETAIL/world-generation-system.md` and `DESIGN/DETAIL/stitch-pathfinding.md`.

## Dependencies

- scaffold-server-workspace
