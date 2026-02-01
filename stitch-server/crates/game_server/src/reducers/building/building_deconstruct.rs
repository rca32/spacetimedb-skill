use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::services::building_defs::get_building_def;
use crate::services::reward_distribute;
use crate::tables::{building_footprint_trait, building_state_trait};

#[spacetimedb::reducer]
pub fn building_deconstruct(ctx: &ReducerContext, building_id: u64) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    let building = ctx
        .db
        .building_state()
        .entity_id()
        .find(&building_id)
        .ok_or("Building not found".to_string())?;

    if building.owner_id != player_entity_id {
        return Err("Not owner".to_string());
    }

    let def =
        get_building_def(building.building_def_id).ok_or("Building def not found".to_string())?;
    reward_distribute::grant_items(ctx, player_entity_id, &def.deconstruction.refund_materials)?;

    for tile in ctx
        .db
        .building_footprint()
        .iter()
        .filter(|f| f.building_entity_id == building_id)
    {
        ctx.db.building_footprint().tile_id().delete(&tile.tile_id);
    }

    ctx.db.building_state().entity_id().delete(&building_id);

    Ok(())
}
