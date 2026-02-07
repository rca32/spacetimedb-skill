use spacetimedb::ReducerContext;

use crate::services::permissions;
use crate::tables::building_state::building_state;

#[spacetimedb::reducer]
pub fn building_advance(ctx: &ReducerContext, building_id: u64, steps: u32) -> Result<(), String> {
    if steps == 0 {
        return Err("steps must be > 0".to_string());
    }

    let mut building = ctx
        .db
        .building_state()
        .entity_id()
        .find(building_id)
        .ok_or("building not found".to_string())?;

    if building.state != 0 {
        return Err("building is not in project state".to_string());
    }

    if building.owner_identity != ctx.sender
        && !permissions::has_permission(ctx, 2, building_id, permissions::PERM_BUILD)
    {
        return Err("no build permission".to_string());
    }

    building.build_progress = building.build_progress.saturating_add(steps);
    if building.build_progress >= building.build_required {
        building.build_progress = building.build_required;
        building.state = 1;
    }
    building.updated_at = ctx.timestamp;
    ctx.db.building_state().entity_id().update(building);

    Ok(())
}
