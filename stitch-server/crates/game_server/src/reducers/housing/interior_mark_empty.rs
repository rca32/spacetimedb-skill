use std::time::Duration;

use spacetimedb::{ReducerContext, ScheduleAt, Table, TimeDuration};

use crate::services::permissions;
use crate::tables::housing::{housing_state, interior_collapse_timer};
use crate::tables::InteriorCollapseTimer;

#[spacetimedb::reducer]
pub fn interior_mark_empty(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    is_empty: bool,
    respawn_delay_seconds: u32,
) -> Result<(), String> {
    let mut housing = ctx
        .db
        .housing_state()
        .entity_id()
        .find(housing_entity_id)
        .ok_or("housing not found".to_string())?;

    if ctx.sender != housing.owner_identity
        && !permissions::has_permission(ctx, 3, housing_entity_id, permissions::PERM_ADMIN)
    {
        return Err("no permission to mark interior state".to_string());
    }

    housing.is_empty = is_empty;
    ctx.db.housing_state().entity_id().update(housing);

    if is_empty {
        let timer = InteriorCollapseTimer {
            scheduled_id: housing_entity_id,
            scheduled_at: ScheduleAt::Time(
                ctx.timestamp
                    + TimeDuration::from_duration(Duration::from_secs(
                        respawn_delay_seconds as u64,
                    )),
            ),
            housing_entity_id,
        };

        if ctx
            .db
            .interior_collapse_timer()
            .scheduled_id()
            .find(housing_entity_id)
            .is_some()
        {
            ctx.db
                .interior_collapse_timer()
                .scheduled_id()
                .update(timer);
        } else {
            ctx.db.interior_collapse_timer().insert(timer);
        }
    }

    Ok(())
}
