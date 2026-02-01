---
id: building-system-core
title: Building system core
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - worldgen-terrain-pathfinding
  - claim-permission-empire-housing
  - inventory-item-stacks
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T06:15:50.812Z
---

# Work Item: Building system core

## Description

Implement building placement, project sites, construction progress, footprints, moving/deconstructing, and repair/decay integration.

## Acceptance Criteria

- [ ] Project site placement validates terrain, footprint, and permissions.
- [ ] Material contribution and construction progress reducers work end-to-end.
- [ ] Completed buildings create footprints and initialize functions/interiors.
- [ ] Move/deconstruct/repair flows enforce costs and permissions.

## Technical Notes

Follow `DESIGN/DETAIL/building-system-design.md` for schemas and reducers.

## Dependencies

- worldgen-terrain-pathfinding
- claim-permission-empire-housing
- inventory-item-stacks
