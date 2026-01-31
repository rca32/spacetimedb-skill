---
id: core-data-models
title: Core Data Models
intent: cozy-mmo-game
complexity: medium
mode: confirm
status: completed
depends_on:
  - setup-project-structure
created: 2026-01-31T00:00:00Z
run_id: run-001
completed_at: 2026-01-30T18:14:12.316Z
---

# Work Item: Core Data Models

## Description
Implement essential SpacetimeDB tables for the MVP based on DESIGN/05-data-model-tables/. Create the foundational data layer that other systems will build upon.

## Acceptance Criteria

- [ ] Account table (account.md) - identity, created_at, is_active
- [ ] PlayerState table (player_state.md) - account_link, position, status
- [ ] InventoryContainer table (inventory_container.md) - owner, slots, max_slots
- [ ] InventorySlot table (inventory_slot.md) - container_id, slot_index, item_ref
- [ ] ItemDef table (item_def.md) - item_id, name, category, stackable, max_stack
- [ ] ItemInstance table (item_instance.md) - instance_id, def_id, quantity, durability
- [ ] SessionState table (session_state.md) - connection tracking, last_active
- [ ] Proper indexes on frequently queried fields
- [ ] Relations between tables defined (foreign keys where applicable)

## Technical Notes

- Follow SpacetimeDB table decorator patterns: `#[spacetimedb(table)]`
- Use appropriate primary keys (Identity for accounts, auto-increment for instances)
- Consider table relationships: Account → PlayerState → InventoryContainer → InventorySlot → ItemInstance → ItemDef
- Position should use hex grid coordinates (q, r, s or x, y, z)

## Dependencies

- setup-project-structure
