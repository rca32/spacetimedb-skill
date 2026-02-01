use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::services::reward_distribute;
use crate::tables::{building_footprint_trait, project_site_state_trait};

/// Cancel a building project and refund contributed materials
/// Only the owner or contributors can cancel a project
#[spacetimedb::reducer]
pub fn building_cancel_project(ctx: &ReducerContext, project_site_id: u64) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;

    // Get the project site
    let project = ctx
        .db
        .project_site_state()
        .entity_id()
        .find(&project_site_id)
        .ok_or("Project site not found".to_string())?;

    // Check if player is the owner or a contributor
    let is_owner = project.owner_id == player_entity_id;
    let is_contributor = project
        .contributors
        .iter()
        .any(|c| c.player_id == player_entity_id);

    if !is_owner && !is_contributor {
        return Err("Only the owner or contributors can cancel this project".to_string());
    }

    // Check if project is already abandoned
    if project.is_abandoned {
        return Err("Project is already abandoned".to_string());
    }

    // Refund contributed materials to the owner
    for material in &project.materials_contributed {
        if material.quantity > 0 {
            // Try to refund materials - ignore errors if inventory is full
            let _ = reward_distribute::grant_items(
                ctx,
                project.owner_id,
                &[crate::tables::InputItemStack {
                    item_def_id: material.item_def_id,
                    quantity: material.quantity,
                }],
            );
        }
    }

    // Remove any building footprint tiles associated with this project
    for tile in ctx
        .db
        .building_footprint()
        .iter()
        .filter(|f| f.building_entity_id == project.entity_id)
    {
        ctx.db.building_footprint().tile_id().delete(&tile.tile_id);
    }

    // Delete the project site
    ctx.db
        .project_site_state()
        .entity_id()
        .delete(&project.entity_id);

    Ok(())
}
