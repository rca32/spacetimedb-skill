# Implementation Plan

## Work Item: implement-eat-reducer-food-system (Confirm Mode)

### Overview
Implement the `eat` reducer to allow players to consume food items. This is a critical feature that enables the food/regeneration gameplay loop.

### Approach
1. First create `starving_state` table to track starvation debuff
2. Implement `eat` reducer with full validation and effects

### Files to Create
- `stitch-server/crates/game_server/src/tables/starving_state.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/tables/mod.rs` (add starving_state export)
- `stitch-server/crates/game_server/src/reducers/player/eat.rs` (currently empty)

### Implementation Details

**1. starving_state table:**
```rust
#[spacetimedb::table(name = starving_state)]
pub struct StarvingState {
    #[primary_key]
    pub entity_id: u64,
    pub started_at: u64,
    pub debuff_id: u32,
}
```

**2. eat reducer logic:**
```rust
use spacetimedb::{ReducerContext, Table};
use crate::reducers::quest::get_sender_entity;
use crate::tables::{
    food_def_trait, inventory_slot_trait, item_instance_trait,
    resource_state_trait, starving_state_trait, item_def_trait,
    FoodDef, InventorySlot, ItemInstance, ResourceState, StarvingState, ItemDef
};

pub fn eat(ctx: &ReducerContext, item_instance_id: u64) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    
    // Find item in player's inventory
    let slot = ctx.db.inventory_slot()
        .iter()
        .find(|s| s.item_instance_id == item_instance_id)
        .ok_or("Item not found in inventory")?;
    
    // Get item instance
    let item = ctx.db.item_instance()
        .item_instance_id()
        .find(&item_instance_id)
        .ok_or("Item instance not found")?;
    
    // Find food_def by item_def_id
    let food = ctx.db.food_def()
        .iter()
        .find(|f| f.item_def_id == item.item_def_id)
        .ok_or("Item is not food")?;
    
    // Get current resource state
    let mut resource = ctx.db.resource_state()
        .entity_id()
        .find(&player_entity_id)
        .ok_or("Resource state not found")?;
    
    // Apply food effects (with max cap)
    let max_hp = ctx.db.character_stats().entity_id().find(&player_entity_id).map(|c| c.max_hp).unwrap_or(100);
    let max_stamina = ctx.db.character_stats().entity_id().find(&player_entity_id).map(|c| c.max_stamina).unwrap_or(100);
    let max_satiation = ctx.db.character_stats().entity_id().find(&player_entity_id).map(|c| c.max_satiation).unwrap_or(100);
    
    resource.hp = (resource.hp as i32 + food.hp_restore).clamp(0, max_hp as i32) as u32;
    resource.stamina = (resource.stamina as i32 + food.stamina_restore).clamp(0, max_stamina as i32) as u32;
    resource.satiation = (resource.satiation as i32 + food.satiation_restore).clamp(0, max_satiation as i32) as u32;
    
    ctx.db.resource_state().entity_id().update(resource);
    
    // Remove item from inventory
    ctx.db.inventory_slot().slot_id().delete(slot.slot_id);
    ctx.db.item_instance().item_instance_id().delete(item_instance_id);
    
    // Remove starving debuff if satiation > 0
    if resource.satiation > 0 {
        if let Some(_) = ctx.db.starving_state().entity_id().find(&player_entity_id) {
            ctx.db.starving_state().entity_id().delete(player_entity_id);
        }
    }
    
    Ok(())
}
```

### Tests
- AI tester calls eat with valid food item
- Verify resource_state updates correctly
- Verify item removed from inventory
- Test edge cases: max HP/stamina/satiation cap, starving debuff removal

### Acceptance Criteria
- [ ] eat reducer accepts item_instance_id parameter
- [ ] Validates food exists in inventory
- [ ] Applies HP/stamina/satiation recovery based on food_def
- [ ] Removes consumed item from inventory
- [ ] Updates resource_state table
- [ ] Removes starving debuff if satiation > 0
- [ ] Returns appropriate errors
- [ ] AI tester can successfully test food consumption

---

## Approve this plan? [Y/n/edit]