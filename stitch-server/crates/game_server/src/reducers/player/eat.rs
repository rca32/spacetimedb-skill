use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::tables::{
    character_stats_trait, food_def_trait, inventory_container_trait, inventory_slot_trait,
    item_instance_trait, resource_state_trait, starving_state_trait,
};

#[spacetimedb::reducer]
pub fn eat(ctx: &ReducerContext, item_instance_id: u64) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;

    // Get player's inventory container
    let player_container = ctx
        .db
        .inventory_container()
        .owner_entity_id()
        .filter(&player_entity_id)
        .next()
        .ok_or("Player inventory not found")?;

    // Find item in player's inventory
    let slot = ctx
        .db
        .inventory_slot()
        .container_id()
        .filter(&player_container.container_id)
        .find(|s| s.item_instance_id == item_instance_id)
        .ok_or("Item not found in inventory")?;

    // Get item instance
    let item = ctx
        .db
        .item_instance()
        .item_instance_id()
        .find(&item_instance_id)
        .ok_or("Item instance not found")?;

    // Find food_def by item_def_id
    let food = ctx
        .db
        .food_def()
        .iter()
        .find(|f| f.item_def_id == item.item_def_id)
        .ok_or("Item is not food")?;

    // Get current resource state
    let mut resource = ctx
        .db
        .resource_state()
        .entity_id()
        .find(&player_entity_id)
        .ok_or("Resource state not found")?;

    // Get max values from character_stats
    let (max_hp, max_stamina, max_satiation) = ctx
        .db
        .character_stats()
        .entity_id()
        .find(&player_entity_id)
        .map(|c| (c.max_hp, c.max_stamina, c.max_satiation))
        .unwrap_or((100, 100, 100));

    // Apply food effects (with max cap)
    resource.hp = ((resource.hp as i32 + food.hp_restore).max(0) as u32).min(max_hp);
    resource.stamina =
        ((resource.stamina as i32 + food.stamina_restore).max(0) as u32).min(max_stamina);
    resource.satiation =
        ((resource.satiation as i32 + food.satiation_restore).max(0) as u32).min(max_satiation);

    // Store satiation value before update for starving check
    let satiation = resource.satiation;

    ctx.db.resource_state().entity_id().update(resource);

    // Remove item from inventory slot
    ctx.db.inventory_slot().slot_id().delete(slot.slot_id);

    // Delete item instance
    ctx.db
        .item_instance()
        .item_instance_id()
        .delete(item_instance_id);

    // Remove starving debuff if satiation > 0
    if satiation > 0 {
        if let Some(_) = ctx.db.starving_state().entity_id().find(&player_entity_id) {
            ctx.db.starving_state().entity_id().delete(player_entity_id);
        }
    }

    Ok(())
}
