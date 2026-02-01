use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::services::building_defs::get_building_def;
use crate::services::building_placement::build_footprint_tiles;
use crate::services::building_progress::{advance_action, remaining_materials, update_project};
use crate::tables::{
    building_footprint_trait, building_state_trait, project_site_state_trait, BuildingState,
    BuildingStateEnum,
};

#[spacetimedb::reducer]
pub fn building_advance(ctx: &ReducerContext, project_site_id: u64) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    let mut project = ctx
        .db
        .project_site_state()
        .entity_id()
        .find(&project_site_id)
        .ok_or("Project site not found".to_string())?;

    let def =
        get_building_def(project.building_def_id).ok_or("Building def not found".to_string())?;
    let remaining = remaining_materials(&project, &def);
    if !remaining.is_empty() {
        return Err("Materials required".to_string());
    }

    advance_action(&mut project, player_entity_id);
    project.last_progress_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;

    if project.current_actions < project.total_actions {
        update_project(ctx, project);
        return Ok(());
    }

    let building_id = ctx.random();
    ctx.db.building_state().insert(BuildingState {
        entity_id: building_id,
        building_def_id: project.building_def_id,
        owner_id: project.owner_id,
        claim_id: project.claim_id,
        constructed_by: Some(player_entity_id),
        hex_x: project.hex_x,
        hex_z: project.hex_z,
        facing: project.facing,
        dimension_id: project.dimension_id,
        current_durability: def.max_durability,
        max_durability: def.max_durability,
        state: BuildingStateEnum::Normal,
        last_maintenance_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
        is_active: true,
        nickname: None,
        interior_instance_id: None,
    });

    for mut tile in build_footprint_tiles(
        &def,
        project.hex_x,
        project.hex_z,
        project.facing,
        project.dimension_id,
        building_id,
    ) {
        tile.tile_id = ctx.random();
        ctx.db.building_footprint().insert(tile);
    }

    for tile in ctx
        .db
        .building_footprint()
        .iter()
        .filter(|f| f.building_entity_id == project.entity_id)
    {
        ctx.db.building_footprint().tile_id().delete(&tile.tile_id);
    }

    ctx.db
        .project_site_state()
        .entity_id()
        .delete(&project.entity_id);

    Ok(())
}
