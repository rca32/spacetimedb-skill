use spacetimedb::{ReducerContext, Table};

use crate::services::permissions;
use crate::tables::housing::{housing_state, rent_state};
use crate::tables::transform_state::transform_state;
use crate::tables::TransformState;

#[spacetimedb::reducer]
pub fn housing_enter(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    portal_x: f32,
    portal_y: f32,
    portal_z: f32,
) -> Result<(), String> {
    let housing = ctx
        .db
        .housing_state()
        .entity_id()
        .find(housing_entity_id)
        .ok_or("housing not found".to_string())?;

    if ctx.timestamp.duration_since(housing.locked_until).is_none() {
        return Err("housing is locked".to_string());
    }

    if ctx.sender != housing.owner_identity {
        let permitted_by_rent = ctx
            .db
            .rent_state()
            .entity_id()
            .find(housing_entity_id)
            .map(|r| r.white_list.contains(&ctx.sender))
            .unwrap_or(false);

        let permitted_by_permissions = permissions::has_permission(
            ctx,
            3,
            housing_entity_id,
            permissions::PERM_USE,
        ) || permissions::has_permission(ctx, 2, housing.entrance_building_entity_id, permissions::PERM_BUILD);

        if !permitted_by_rent && !permitted_by_permissions {
            return Err("no access to housing".to_string());
        }
    }

    let next = TransformState {
        entity_id: ctx.sender,
        region_id: housing.region_index as u64,
        position: vec![portal_x, portal_y, portal_z],
        rotation: vec![0.0, 0.0, 0.0, 1.0],
        updated_at: ctx.timestamp,
    };

    if ctx.db.transform_state().entity_id().find(ctx.sender).is_some() {
        ctx.db.transform_state().entity_id().update(next);
    } else {
        ctx.db.transform_state().insert(next);
    }

    Ok(())
}
