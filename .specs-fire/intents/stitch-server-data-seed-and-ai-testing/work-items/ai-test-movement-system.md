---
id: ai-test-movement-system
intent: stitch-server-data-seed-and-ai-testing
complexity: low
mode: autopilot
status: pending
depends_on:
  - add-inventory-creation-to-bootstrap
created: 2026-02-01T22:05:00Z
---

# Work Item: AI test player movement system

## Description

Test the complete movement system using stitch-server-ai-tester skill. Move player, verify position and stamina changes.

## Acceptance Criteria

- [ ] Can query transform_state for current position
- [ ] Can call move_player to new coordinates
- [ ] Position updates correctly after move
- [ ] Stamina decreases after move
- [ ] Document all test commands

## Technical Notes

**AI Testing Sequence:**
```bash
# 1. Check current position
spacetime sql stitch-server "SELECT hex_x, hex_z, is_moving FROM transform_state"

# 2. Check stamina before move
spacetime sql stitch-server "SELECT stamina FROM resource_state"

# 3. Move player
spacetime call stitch-server move_player 110 110 false

# 4. Verify new position
spacetime sql stitch-server "SELECT hex_x, hex_z FROM transform_state"

# 5. Verify stamina decreased
spacetime sql stitch-server "SELECT stamina FROM resource_state"

# 6. Test running (is_running=true)
spacetime call stitch-server move_player 115 115 true
spacetime sql stitch-server "SELECT hex_x, hex_z, stamina FROM transform_state, resource_state"
```

**Test Report Output:**
Document movement tests including:
- Normal move vs running stamina cost
- Position updates
- Edge cases (invalid coordinates, etc.)

## Dependencies

- add-inventory-creation-to-bootstrap (player must exist)
