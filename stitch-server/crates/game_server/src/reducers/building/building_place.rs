use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::services::building_defs::get_building_def;
use crate::services::building_placement::{build_footprint_tiles, validate_placement};
use crate::tables::{
    building_footprint_trait, building_state_trait, project_site_state_trait, BuildingState,
    BuildingStateEnum, ProjectSiteState,
};

#[spacetimedb::reducer]
pub fn building_place(
    ctx: &ReducerContext,
    building_def_id: u32,
    hex_x: i32,
    hex_z: i32,
    facing: u8,
    dimension_id: u32,
) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    let (def, validation) = validate_placement(
        ctx,
        building_def_id,
        hex_x,
        hex_z,
        facing,
        dimension_id,
        player_entity_id,
    )?;

    if def.construction.instant_build {
        let building_id = ctx.random();
        ctx.db.building_state().insert(BuildingState {
            entity_id: building_id,
            building_def_id,
            owner_id: player_entity_id,
            claim_id: validation.claim_id,
            constructed_by: Some(player_entity_id),
            hex_x,
            hex_z,
            facing,
            dimension_id,
            current_durability: def.max_durability,
            max_durability: def.max_durability,
            state: BuildingStateEnum::Normal,
            last_maintenance_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
            is_active: true,
            nickname: None,
            interior_instance_id: None,
        });

        for mut tile in build_footprint_tiles(&def, hex_x, hex_z, facing, dimension_id, building_id)
        {
            tile.tile_id = ctx.random();
            ctx.db.building_footprint().insert(tile);
        }
        return Ok(());
    }

    let project_id = ctx.random();
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let def = get_building_def(building_def_id).ok_or("Building def not found".to_string())?;

    ctx.db.project_site_state().insert(ProjectSiteState {
        entity_id: project_id,
        building_def_id,
        owner_id: player_entity_id,
        claim_id: validation.claim_id,
        hex_x,
        hex_z,
        facing,
        dimension_id,
        current_actions: 0,
        total_actions: def.construction.required_actions,
        materials_contributed: Vec::new(),
        contributors: vec![crate::tables::ContributorInfo {
            player_id: player_entity_id,
            actions_performed: 0,
            materials_contributed: Vec::new(),
        }],
        created_at: now,
        last_progress_at: now,
        is_abandoned: false,
    });

    for mut tile in build_footprint_tiles(&def, hex_x, hex_z, facing, dimension_id, project_id) {
        tile.tile_id = ctx.random();
        ctx.db.building_footprint().insert(tile);
    }

    Ok(())
}
