use spacetimedb::{ReducerContext, Table};

use crate::tables::{MovementActorState, MovementRequestLog, TransformState};
use crate::tables::movement::movement_actor_state;
use crate::tables::movement::movement_request_log;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::validation::anti_cheat;

#[spacetimedb::reducer]
pub fn move_to(
    ctx: &ReducerContext,
    request_id: String,
    region_id: u64,
    client_ts_ms: u64,
    x: f32,
    y: f32,
    z: f32,
) -> Result<(), String> {
    let request_id = anti_cheat::validate_request_id(&request_id)?;

    let next_position = vec![x, y, z];
    if !x.is_finite() || !y.is_finite() || !z.is_finite() {
        anti_cheat::log_movement_violation(
            ctx,
            "invalid_position",
            next_position,
            &request_id,
            region_id,
            client_ts_ms,
        );
        return Ok(());
    }

    if anti_cheat::is_duplicate_request(ctx, &request_id) {
        // Idempotent duplicate: no re-apply, no additional side effects.
        return Ok(());
    }

    let session = match ctx.db.session_state().identity().find(ctx.sender) {
        Some(session) => session,
        None => {
            anti_cheat::log_movement_violation(
                ctx,
                "missing_session",
                next_position,
                &request_id,
                region_id,
                client_ts_ms,
            );
            return Ok(());
        }
    };

    if session.region_id != region_id {
        anti_cheat::log_movement_violation(
            ctx,
            "region_mismatch",
            next_position,
            &request_id,
            region_id,
            client_ts_ms,
        );
        return Ok(());
    }

    let actor_state = ctx.db.movement_actor_state().identity().find(ctx.sender);
    if let Err(reason) = anti_cheat::validate_actor_progression(actor_state, client_ts_ms, &next_position)
    {
        anti_cheat::log_movement_violation(
            ctx,
            reason,
            next_position,
            &request_id,
            region_id,
            client_ts_ms,
        );
        return Ok(());
    }

    let next_transform = TransformState {
        entity_id: ctx.sender,
        region_id,
        position: next_position.clone(),
        rotation: vec![0.0, 0.0, 0.0, 1.0],
        updated_at: ctx.timestamp,
    };
    if ctx.db.transform_state().entity_id().find(ctx.sender).is_some() {
        ctx.db.transform_state().entity_id().update(next_transform);
    } else {
        ctx.db.transform_state().insert(next_transform);
    }

    ctx.db.movement_request_log().insert(MovementRequestLog {
        request_key: anti_cheat::request_key(ctx.sender, &request_id),
        identity: ctx.sender,
        request_id: request_id.clone(),
        region_id,
        client_ts_ms,
        accepted: true,
        processed_at: ctx.timestamp,
    });

    let next_actor_state = MovementActorState {
        identity: ctx.sender,
        region_id,
        last_client_ts_ms: client_ts_ms,
        last_request_id: request_id,
        last_position: next_position,
        updated_at: ctx.timestamp,
    };
    if ctx.db.movement_actor_state().identity().find(ctx.sender).is_some() {
        ctx.db.movement_actor_state().identity().update(next_actor_state);
    } else {
        ctx.db.movement_actor_state().insert(next_actor_state);
    }

    Ok(())
}
