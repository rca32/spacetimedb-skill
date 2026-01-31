---
id: inventory-system
title: Inventory System
intent: cozy-mmo-game
complexity: medium
mode: confirm
status: completed
depends_on:
  - core-data-models
created: 2026-01-31T00:00:00Z
run_id: run-001
completed_at: 2026-01-30T18:16:48.393Z
---

# Work Item: Inventory System

## Description
Implement item pickup, storage, and management. Players can collect items and manage their inventory.

## Acceptance Criteria

- [ ] pickup_item reducer - adds item to inventory
- [ ] drop_item reducer - removes item from inventory, creates world item
- [ ] move_item reducer - rearranges items in inventory slots
- [ ] Stack handling (stackable items combine)
- [ ] Inventory capacity limits enforced
- [ ] ItemInstance creation on pickup
- [ ] World items spawn/despawn
- [ ] Client can view and manage inventory

## Technical Notes

- InventoryContainer linked to PlayerState
- InventorySlot tracks position in container
- Stackable items should auto-combine
- Non-stackable items need separate slots
- World items are temporary ItemInstances not in inventory
- Consider inventory persistence on logout

## Dependencies

- core-data-models
