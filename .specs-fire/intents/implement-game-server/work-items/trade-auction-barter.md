---
id: trade-auction-barter
title: Trade, auction, and barter systems
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - inventory-item-stacks
  - player-state-movement-skills
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T03:30:17.539Z
---

# Work Item: Trade, auction, and barter systems

## Description

Implement trade sessions, escrow locking, auction orders/fills, barter orders, and timeout handling.

## Acceptance Criteria

- [ ] Trade session reducers lock pockets and finalize exchanges safely.
- [ ] Auction orders match and fill with correct escrow handling.
- [ ] Barter orders validate distance, permissions, and inventory.
- [ ] Trade timeout/cleanup agent handles disconnects and stale sessions.

## Technical Notes

Follow `DESIGN/DETAIL/stitch-trade-and-auction.md`.

## Dependencies

- inventory-item-stacks
- player-state-movement-skills
