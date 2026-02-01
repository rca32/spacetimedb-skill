---
id: add-inventory-creation-to-bootstrap
intent: stitch-server-data-seed-and-ai-testing
complexity: medium
mode: confirm
status: pending
depends_on: []
created: 2026-02-01T22:05:00Z
---

# Work Item: Add inventory creation to account bootstrap

## Description

Modify account_bootstrap to create inventory_container and initial slots for new players. Required for eat reducer and inventory operations.

## Acceptance Criteria

- [ ] account_bootstrap creates inventory_container with owner_entity_id
- [ ] Creates 20 inventory slots with container_id
- [ ] Slots have proper slot_index (0-19)
- [ ] AI tester can query inventory: `spacetime sql stitch-server "SELECT * FROM inventory_container"`
- [ ] New players have inventory after bootstrap

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/reducers/auth/account_bootstrap.rs`

**Tables to populate:**
- inventory_container: container_id, owner_entity_id, slot_count=20
- inventory_slot: 20 slots per container

**AI Testing Commands:**
```bash
# Before: No inventory
spacetime sql stitch-server "SELECT COUNT(*) FROM inventory_container"

# Call bootstrap
spacetime call stitch-server account_bootstrap '"TestPlayer"'

# After: Inventory exists
spacetime sql stitch-server "SELECT container_id, owner_entity_id FROM inventory_container"
spacetime sql stitch-server "SELECT COUNT(*) FROM inventory_slot WHERE container_id = X"
```

## Dependencies

(none)
