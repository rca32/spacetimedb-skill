---
id: ai-test-food-system
intent: stitch-server-data-seed-and-ai-testing
complexity: medium
mode: confirm
status: pending
depends_on:
  - seed-food-def-data
  - seed-item-def-data
  - add-inventory-creation-to-bootstrap
created: 2026-02-01T22:05:00Z
---

# Work Item: AI test food system end-to-end

## Description

Test the complete food system using stitch-server-ai-tester skill. Create food item in inventory, eat it, verify stat changes.

## Acceptance Criteria

- [ ] Can query food_def and see food data
- [ ] Can create food item in player inventory (via SQL or reducer)
- [ ] Can call eat reducer with item_instance_id
- [ ] Resource state updates correctly after eating
- [ ] Item removed from inventory after eating
- [ ] Document all test commands in test report

## Technical Notes

**AI Testing Sequence:**
```bash
# 1. Check food definitions
spacetime sql stitch-server "SELECT food_id, item_def_id, hp_restore, satiation_restore FROM food_def"

# 2. Check player resources before
spacetime sql stitch-server "SELECT hp, stamina, satiation FROM resource_state"

# 3. Create food item (requires item_instance + inventory_slot insert)
# This may require direct DB manipulation or helper reducer

# 4. Call eat reducer
spacetime call stitch-server eat <item_instance_id>

# 5. Verify resource changes
spacetime sql stitch-server "SELECT hp, stamina, satiation FROM resource_state"

# 6. Verify item removed
spacetime sql stitch-server "SELECT COUNT(*) FROM inventory_slot WHERE item_instance_id = X"
```

**Test Report Output:**
Create markdown report documenting:
- Pre-test state
- Test commands executed
- Expected vs actual results
- Success/failure status

## Dependencies

- seed-food-def-data (needs food definitions)
- seed-item-def-data (needs item definitions)
- add-inventory-creation-to-bootstrap (needs inventory)
