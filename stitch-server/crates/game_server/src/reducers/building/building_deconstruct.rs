use spacetimedb::ReducerContext;

use crate::services::permissions;
use crate::tables::building_state::building_state;

use super::building_place::add_items_to_main_inventory;

#[spacetimedb::reducer]
pub fn building_deconstruct(ctx: &ReducerContext, building_id: u64) -> Result<(), String> {
    let mut building = ctx
        .db
        .building_state()
        .entity_id()
        .find(building_id)
        .ok_or("building not found".to_string())?;

    if building.owner_identity != ctx.sender
        && !permissions::has_permission(ctx, 2, building_id, permissions::PERM_BUILD)
    {
        return Err("no deconstruct permission".to_string());
    }

    if building.state == 2 {
        return Ok(());
    }

    // Refund half of required materials.
    let refund = (building.required_item_qty / 2).max(1);
    add_items_to_main_inventory(ctx, building.required_item_def_id, refund)?;

    building.state = 2;
    building.updated_at = ctx.timestamp;
    ctx.db.building_state().entity_id().update(building);

    Ok(())
}
