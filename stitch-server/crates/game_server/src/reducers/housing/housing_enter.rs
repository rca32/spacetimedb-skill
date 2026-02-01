use spacetimedb::ReducerContext;

use crate::reducers::quest::get_sender_entity;
use crate::services::permission_check::{check_permission, is_rent_whitelisted, PERMISSION_USAGE};
use crate::tables::{housing_state_trait, transform_state_trait};

#[spacetimedb::reducer]
pub fn housing_enter(ctx: &ReducerContext, housing_entity_id: u64) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    let housing = ctx
        .db
        .housing_state()
        .entity_id()
        .find(&housing_entity_id)
        .ok_or("Housing not found".to_string())?;

    if housing.locked_until > ctx.timestamp.to_micros_since_unix_epoch() as u64 {
        return Err("Housing locked".to_string());
    }

    if !is_rent_whitelisted(ctx, housing.entity_id, player_entity_id) {
        return Err("Not allowed".to_string());
    }

    check_permission(
        ctx,
        player_entity_id,
        housing.entity_id,
        None,
        PERMISSION_USAGE,
    )?;

    let portal = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&housing.exit_portal_entity_id)
        .ok_or("Portal transform missing".to_string())?;

    let mut transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&player_entity_id)
        .ok_or("Player transform missing".to_string())?;

    transform.hex_x = portal.hex_x;
    transform.hex_z = portal.hex_z;
    transform.dest_hex_x = portal.hex_x;
    transform.dest_hex_z = portal.hex_z;
    transform.dimension = portal.dimension;
    transform.is_moving = false;
    transform.updated_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    ctx.db.transform_state().entity_id().update(transform);

    Ok(())
}
