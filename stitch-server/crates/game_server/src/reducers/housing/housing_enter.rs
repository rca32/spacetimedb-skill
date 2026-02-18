use spacetimedb::{ReducerContext, Table};

use crate::services::hex_coords::DEFAULT_WORLD_DIMENSION_ID;
use crate::services::permissions;
use crate::services::projection_views;
use crate::tables::housing::{dimension_desc, housing_state, rent_state};
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::tables::{SessionState, TransformState};

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

        let permitted_by_permissions =
            permissions::has_permission(ctx, 3, housing_entity_id, permissions::PERM_USE)
                || permissions::has_permission(
                    ctx,
                    2,
                    housing.entrance_building_entity_id,
                    permissions::PERM_BUILD,
                );

        if !permitted_by_rent && !permitted_by_permissions {
            return Err("no access to housing".to_string());
        }
    }

    let target_dimension_id = ctx
        .db
        .dimension_desc()
        .iter()
        .find(|row| row.network_entity_id == housing.network_entity_id)
        .map(|row| row.dimension_id)
        .unwrap_or(DEFAULT_WORLD_DIMENSION_ID);

    let next = TransformState {
        entity_id: ctx.sender,
        region_id: housing.region_index as u64,
        dimension_id: target_dimension_id,
        position: vec![portal_x, portal_y, portal_z],
        rotation: vec![0.0, 0.0, 0.0, 1.0],
        updated_at: ctx.timestamp,
    };

    if ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender)
        .is_some()
    {
        ctx.db.transform_state().entity_id().update(next);
    } else {
        ctx.db.transform_state().insert(next);
    }

    if let Some(mut session) = ctx.db.session_state().identity().find(ctx.sender) {
        session.region_id = housing.region_index as u64;
        session.dimension_id = target_dimension_id;
        session.last_active_at = ctx.timestamp;
        ctx.db.session_state().identity().update(SessionState {
            identity: session.identity,
            region_id: session.region_id,
            dimension_id: session.dimension_id,
            last_active_at: session.last_active_at,
        });
        projection_views::sync_player_session_view(ctx, ctx.sender);
    }

    Ok(())
}
