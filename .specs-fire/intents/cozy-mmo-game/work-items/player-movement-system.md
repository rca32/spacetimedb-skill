---
id: player-movement-system
title: Player Movement System
intent: cozy-mmo-game
complexity: medium
mode: confirm
status: completed
depends_on:
  - authentication-system
created: 2026-01-31T00:00:00Z
run_id: run-001
completed_at: 2026-01-30T18:16:10.913Z
---

# Work Item: Player Movement System

## Description
Implement hex grid-based player movement system. Players can move their character in the game world with proper validation and state updates.

## Acceptance Criteria

- [ ] move_player reducer - updates PlayerState position
- [ ] Position validation (adjacent hex check)
- [ ] Movement constraints (energy/cooldown if applicable)
- [ ] PlayerState.position uses hex coordinates (q, r)
- [ ] Movement events/callbacks for client updates
- [ ] Basic collision detection (can't move to occupied hex)
- [ ] Client can request movement and receive position updates

## Technical Notes

- Use axial hex coordinates (q, r) for simplicity
- Adjacent hex calculation: (q±1, r), (q, r±1), (q±1, r∓1)
- Consider movement validation on server side
- Updates should be immediate (server-authoritative)
- Client subscribes to position updates

## Dependencies

- authentication-system
