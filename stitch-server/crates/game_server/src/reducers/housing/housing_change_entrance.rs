use std::time::Duration;

use spacetimedb::{ReducerContext, TimeDuration};

use crate::services::permissions;
use crate::tables::building_state::building_state;
use crate::tables::housing::housing_state;

#[spacetimedb::reducer]
pub fn housing_change_entrance(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    new_entrance_building_entity_id: u64,
    target_region_index: u32,
    moving_minutes: i32,
) -> Result<(), String> {
    if moving_minutes < 0 {
        return Err("moving_minutes must be >= 0".to_string());
    }

    let mut housing = ctx
        .db
        .housing_state()
        .entity_id()
        .find(housing_entity_id)
        .ok_or("housing not found".to_string())?;

    if ctx.sender != housing.owner_identity
        && !permissions::has_permission(ctx, 3, housing_entity_id, permissions::PERM_ADMIN)
    {
        return Err("no permission to change housing entrance".to_string());
    }

    if !housing.is_empty {
        return Err("housing must be empty to move entrance".to_string());
    }

    let building = ctx
        .db
        .building_state()
        .entity_id()
        .find(new_entrance_building_entity_id)
        .ok_or("new entrance building not found".to_string())?;

    if building.region_id != target_region_index as u64 {
        return Err("target region mismatch".to_string());
    }

    housing.entrance_building_entity_id = new_entrance_building_entity_id;
    housing.region_index = target_region_index;

    let lock_duration = Duration::from_secs((moving_minutes as u64).saturating_mul(60));
    housing.locked_until = ctx.timestamp + TimeDuration::from_duration(lock_duration);

    ctx.db.housing_state().entity_id().update(housing);
    Ok(())
}
