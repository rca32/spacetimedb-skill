---
id: inventory-crafting-guide
title: 05. Inventory and Crafting System
intent: spacetime-dev-guide
complexity: medium
mode: confirm
status: completed
depends_on:
  - authentication-movement-guide
created: 2026-01-31T05:05:00Z
run_id: run-003
completed_at: 2026-01-31T07:57:32.609Z
---

# Work Item: 05. Inventory and Crafting System

## Description

Document the inventory management system and recipe-based crafting system. Cover item definitions, inventory slots, stack handling, and the crafting validation logic.

## Acceptance Criteria

- [ ] 인벤토리 시스템 설계 개요 (inventory system architecture)
- [ ] ItemDef 테이블 (item definitions with stackable flag)
- [ ] ItemInstance 테이블 (item instances with durability/stack count)
- [ ] InventoryContainer와 InventorySlot 테이블 (container and slot design)
- [ ] 20슬롯 인벤토리 구현 (20-slot inventory implementation)
- [ ] 아이템 줍기 (pickup_item reducer with world items)
- [ ] 아이템 버리기 (drop_item reducer)
- [ ] 인벤토리 내 아이템 이동 (move_item reducer)
- [ ] 스택 가능한 아이템 처리 (stack handling logic)
- [ ] 제작 시스템 설계 (crafting system overview)
- [ ] Recipe와 RecipeIngredient 테이블 (recipe tables)
- [ ] craft_item reducer 구현 (crafting validation and execution)
- [ ] 샘플 레시피 예시 (sample recipes: Wood + Stone → Axe)

## Technical Notes

- Use actual tables from Game/server/src/tables/
- Explain the relationship between ItemDef and ItemInstance
- Show how inventory slots work with slot_index
- Include crafting validation logic explanation

## Dependencies

- authentication-movement-guide
