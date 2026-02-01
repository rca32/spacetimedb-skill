use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::services::building_defs::get_building_def;
use crate::services::building_placement::{build_footprint_tiles, validate_placement};
use crate::tables::{building_footprint_trait, building_state_trait};

#[spacetimedb::reducer]
pub fn building_move(
    ctx: &ReducerContext,
    building_id: u64,
    new_hex_x: i32,
    new_hex_z: i32,
    new_facing: u8,
) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    let mut building = ctx
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
    if !def.can_move {
        return Err("Cannot move".to_string());
    }

    validate_placement(
        ctx,
        building.building_def_id,
        new_hex_x,
        new_hex_z,
        new_facing,
        building.dimension_id,
        player_entity_id,
    )?;

    for tile in ctx
        .db
        .building_footprint()
        .iter()
        .filter(|f| f.building_entity_id == building_id)
    {
        ctx.db.building_footprint().tile_id().delete(&tile.tile_id);
    }

    for mut tile in build_footprint_tiles(
        &def,
        new_hex_x,
        new_hex_z,
        new_facing,
        building.dimension_id,
        building_id,
    ) {
        tile.tile_id = ctx.random();
        ctx.db.building_footprint().insert(tile);
    }

    building.hex_x = new_hex_x;
    building.hex_z = new_hex_z;
    building.facing = new_facing;
    ctx.db.building_state().entity_id().update(building);

    Ok(())
}
