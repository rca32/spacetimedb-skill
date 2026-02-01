---
id: fix-inventory-add-partial
intent: stitch-server-critical-gaps-implementation
complexity: medium
mode: confirm
status: pending
depends_on: [add-player-state-creation]
created: 2026-02-01T21:35:00Z
---

# Work Item: Fix inventory add_partial implementation

## Description

Complete the `add_partial` function in the inventory module. Currently it's partially implemented in `reducers/inventory/mod.rs`. This handles partial stack merging when moving items between containers.

Per DESIGN/DETAIL/stitch-inventory-item-stacks.md Section 3.2.

## Acceptance Criteria

- [ ] `add_partial` function fully implemented
- [ ] Handles adding partial quantity to existing stack
- [ ] Creates new stack if no matching item exists
- [ ] Respects container slot limits
- [ ] Returns quantity that couldn't be added (if container full)
- [ ] Updates source and destination inventory_slot entries
- [ ] Handles edge case: moving from same container
- [ ] Uses proper transaction semantics (all or nothing)
- [ ] Works with `item_stack_move` reducer

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/reducers/inventory/mod.rs`

**Function signature:**
```rust
pub fn add_partial(
    ctx: &ReducerContext,
    container_id: u64,
    item_def_id: u64,
    item_type: u8,
    quantity: i32,
    preferred_slot: Option<u32>,
) -> Result<i32, String>  // Returns remaining quantity
```

**Logic:**
1. Find existing stack with same item_def_id and item_type
2. If found, add as much as possible to that stack (up to max_stack_size)
3. If remainder exists, find empty slot
4. Create new stack in empty slot with remainder
5. Return quantity that couldn't fit (0 if all fit)

**Edge cases:**
- Container has no empty slots
- Item type mismatch
- Negative quantity
- Same source/destination container

## Dependencies

- add-player-state-creation (needs player inventory to exist)
