use spacetimedb::ReducerContext;

use crate::reducers::quest::get_sender_entity;
use crate::services::permission_check::{check_permission, PERMISSION_COOWNER};
use crate::tables::{housing_moving_cost_trait, housing_state_trait, HousingMovingCost};

const MINUTES_TO_MICROS: u64 = 60 * 1_000_000;
const MAX_MOVE_MINUTES: i32 = 20 * 24 * 60;

#[spacetimedb::reducer]
pub fn housing_change_entrance(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    new_entrance_building_entity_id: u64,
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

    let cost = ctx
        .db
        .housing_moving_cost()
        .entity_id()
        .find(&housing.entity_id)
        .unwrap_or(HousingMovingCost {
            entity_id: housing.entity_id,
            moving_time_cost_minutes: 12 * 60,
        });

    let minutes = cost.moving_time_cost_minutes.min(MAX_MOVE_MINUTES).max(0) as u64;
    let locked_until =
        ctx.timestamp.to_micros_since_unix_epoch() as u64 + minutes * MINUTES_TO_MICROS;

    housing.entrance_building_entity_id = new_entrance_building_entity_id;
    housing.locked_until = locked_until;
    ctx.db.housing_state().entity_id().update(housing);

    Ok(())
}
