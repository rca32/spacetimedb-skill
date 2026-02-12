use spacetimedb::{ReducerContext, Table};

use super::sync_rent_whitelist_entries;
use crate::services::permissions;
use crate::tables::building_state::building_state;
use crate::tables::housing::{dimension_desc, dimension_network, housing_state, rent_state};
use crate::tables::{DimensionDesc, DimensionNetwork, HousingState, RentState};

#[spacetimedb::reducer]
pub fn housing_create(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    entrance_building_entity_id: u64,
    network_entity_id: u64,
    dimension_entity_id: u64,
    dimension_id: u32,
    interior_instance_id: u64,
) -> Result<(), String> {
    if ctx
        .db
        .housing_state()
        .entity_id()
        .find(housing_entity_id)
        .is_some()
    {
        return Err("housing already exists".to_string());
    }

    let building = ctx
        .db
        .building_state()
        .entity_id()
        .find(entrance_building_entity_id)
        .ok_or("entrance building not found".to_string())?;

    if building.owner_identity != ctx.sender
        && !permissions::has_permission(ctx, 2, entrance_building_entity_id, permissions::PERM_ADMIN)
    {
        return Err("no permission to create housing".to_string());
    }

    ctx.db.housing_state().insert(HousingState {
        entity_id: housing_entity_id,
        owner_identity: ctx.sender,
        entrance_building_entity_id,
        exit_portal_entity_id: entrance_building_entity_id,
        network_entity_id,
        region_index: building.region_id as u32,
        locked_until: ctx.timestamp,
        is_empty: false,
    });

    ctx.db.dimension_network().insert(DimensionNetwork {
        entity_id: network_entity_id,
        building_id: entrance_building_entity_id,
        collapse_respawn_timestamp: ctx.timestamp,
    });

    ctx.db.dimension_desc().insert(DimensionDesc {
        entity_id: dimension_entity_id,
        dimension_id,
        network_entity_id,
        interior_instance_id,
        collapse_timestamp: ctx.timestamp,
    });

    let white_list = vec![ctx.sender];
    ctx.db.rent_state().insert(RentState {
        entity_id: housing_entity_id,
        white_list: white_list.clone(),
    });
    sync_rent_whitelist_entries(ctx, housing_entity_id, &white_list);

    Ok(())
}
