---
id: inventory-item-stacks
title: Inventory and item stack system
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - player-state-movement-skills
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T01:03:00.873Z
---

# Work Item: Inventory and item stack system

## Description

Implement inventory containers, slots, item instances/stacks, and reducers for moving, picking up, dropping, and locking items.

## Acceptance Criteria

- [ ] Inventory tables match pocket volume, cargo separation, and stack rules.
- [ ] `item_stack_move`, `item_pick_up`, `item_drop`, `inventory_lock` reducers enforce constraints.
- [ ] Item list roll and durability-zero conversion behaviors exist.
- [ ] Discovery hooks and overflow handling are implemented.

## Technical Notes

Follow `DESIGN/DETAIL/stitch-inventory-item-stacks.md` for constraints and edge cases.

## Dependencies

- player-state-movement-skills
