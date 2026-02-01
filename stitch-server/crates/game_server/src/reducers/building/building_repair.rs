use spacetimedb::ReducerContext;

use crate::reducers::quest::get_sender_entity;
use crate::services::building_defs::get_building_def;
use crate::services::permission_check::{check_permission, PERMISSION_BUILD};
use crate::tables::building_state_trait;

#[spacetimedb::reducer]
pub fn building_repair(ctx: &ReducerContext, building_id: u64) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    let mut building = ctx
        .db
        .building_state()
        .entity_id()
        .find(&building_id)
        .ok_or("Building not found".to_string())?;

    if let Some(claim_id) = building.claim_id {
        check_permission(
            ctx,
            player_entity_id,
            claim_id,
            Some(claim_id),
            PERMISSION_BUILD,
        )?;
    } else if building.owner_id != player_entity_id {
        return Err("Not owner".to_string());
    }

    let def =
        get_building_def(building.building_def_id).ok_or("Building def not found".to_string())?;
    building.current_durability = def.max_durability;
    building.state = crate::tables::BuildingStateEnum::Normal;
    ctx.db.building_state().entity_id().update(building);

    Ok(())
}
