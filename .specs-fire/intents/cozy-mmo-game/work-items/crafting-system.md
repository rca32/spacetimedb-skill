---
id: crafting-system
title: Crafting System
intent: cozy-mmo-game
complexity: medium
mode: confirm
status: completed
depends_on:
  - inventory-system
created: 2026-01-31T00:00:00Z
run_id: run-001
completed_at: 2026-01-30T18:17:29.130Z
---

# Work Item: Crafting System

## Description
Implement recipe-based crafting system. Players can combine resources to create new items.

## Acceptance Criteria

- [ ] Recipe definition structure (input items → output item)
- [ ] craft_item reducer - validates recipe, consumes inputs, produces output
- [ ] Recipe validation (check inventory has required items)
- [ ] Item consumption on craft (remove inputs from inventory)
- [ ] Item creation on craft (add output to inventory)
- [ ] At least 2 recipes defined for MVP
- [ ] Basic crafting UI support in client

## Technical Notes

- Recipe definitions can be hardcoded initially
- Recipe structure: ingredients[] + result + quantity
- Validate inventory has ingredients before crafting
- Transaction-like behavior (all or nothing)
- Consider crafting time (instant for MVP)
- Example recipes: Wood + Stone → Axe, Fiber + Stick → Rope

## Dependencies

- inventory-system
