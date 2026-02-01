---
id: claim-permission-empire-housing
title: Claim, permission, empire, and housing systems
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - auth-session-system
  - player-state-movement-skills
  - worldgen-terrain-pathfinding
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T03:59:35.114Z
---

# Work Item: Claim, permission, empire, and housing systems

## Description

Implement claim tiles/members, permission cascade, empire data, and housing/interior dimension flows.

## Acceptance Criteria

- [ ] Claim state, tiles, and member permission tables match design.
- [ ] Permission cascade (entity -> dimension -> claim) is enforced consistently.
- [ ] Empire tables and basic reducers exist for core operations.
- [ ] Housing/interior entry, move, and lock flows are implemented.

## Technical Notes

Use `DESIGN/DETAIL/stitch-claim-empire-management.md`, `DESIGN/DETAIL/stitch-housing-interior.md`, and `DESIGN/DETAIL/stitch-permission-access-control.md`.

## Dependencies

- auth-session-system
- player-state-movement-skills
- worldgen-terrain-pathfinding
