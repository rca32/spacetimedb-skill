use spacetimedb::ReducerContext;

use crate::reducers::quest::get_sender_entity;
use crate::services::permission_check::{check_permission, PERMISSION_COOWNER};
use crate::tables::housing_state_trait;

#[spacetimedb::reducer]
pub fn housing_lock(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    locked_until: u64,
) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    let mut housing = ctx
        .db
        .housing_state()
        .entity_id()
        .find(&housing_entity_id)
        .ok_or("Housing not found".to_string())?;

    check_permission(
        ctx,
        player_entity_id,
        housing.entity_id,
        None,
        PERMISSION_COOWNER,
    )?;

    housing.locked_until = locked_until;
    ctx.db.housing_state().entity_id().update(housing);

    Ok(())
}
