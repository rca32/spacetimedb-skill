use spacetimedb::{ReducerContext, Table};

use crate::services::nav;
use crate::services::projection_views;
use crate::tables::movement::movement_actor_state;
use crate::tables::movement::movement_request_log;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::tables::v2::physics_state;
use crate::tables::{MovementActorState, MovementRequestLog, PhysicsStateV2, SessionState, TransformState};
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
        log::warn!(
            "move_to dropped invalid_position: identity={} request_id={} region_id={} client_ts_ms={} pos=({},{},{})",
            ctx.sender(),
            request_id,
            region_id,
            client_ts_ms,
            x,
            y,
            z
        );
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
        log::info!(
            "move_to duplicate ignored: identity={} request_id={} region_id={} client_ts_ms={}",
            ctx.sender(),
            request_id,
            region_id,
            client_ts_ms
        );
        // Idempotent duplicate: no re-apply, no additional side effects.
        return Ok(());
    }

    let session = match ctx.db.session_state().identity().find(ctx.sender()) {
        Some(session) => session,
        None => {
            log::warn!(
                "move_to dropped missing_session: identity={} request_id={} region_id={} client_ts_ms={}",
                ctx.sender(),
                request_id,
                region_id,
                client_ts_ms
            );
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
        log::warn!(
            "move_to dropped region_mismatch: identity={} request_id={} session_region_id={} request_region_id={} client_ts_ms={}",
            ctx.sender(),
            request_id,
            session.region_id,
            region_id,
            client_ts_ms
        );
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

    // Treat validated movement requests as session activity so active players are not expired.
    ctx.db.session_state().identity().update(SessionState {
        identity: session.identity,
        region_id: session.region_id,
        dimension_id: session.dimension_id,
        last_active_at: ctx.timestamp,
    });

    let actor_state = ctx.db.movement_actor_state().identity().find(ctx.sender());
    if let Err(reason) =
        anti_cheat::validate_actor_progression(actor_state.as_ref(), client_ts_ms, &next_position)
    {
        log::warn!(
            "move_to dropped anti_cheat: identity={} request_id={} reason={} region_id={} client_ts_ms={}",
            ctx.sender(),
            request_id,
            reason,
            region_id,
            client_ts_ms
        );
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

    let current_position = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender())
        .map(|row| row.position)
        .or_else(|| actor_state.as_ref().map(|row| row.last_position.clone()))
        .unwrap_or_else(|| next_position.clone());

    if let Err(reason) = nav::validate_segment_positions(
        ctx,
        region_id,
        session.dimension_id,
        &current_position,
        &next_position,
    ) {
        log::warn!(
            "move_to dropped terrain_validation: identity={} request_id={} reason={} region_id={} client_ts_ms={} pos=({},{},{})",
            ctx.sender(),
            request_id,
            reason,
            region_id,
            client_ts_ms,
            x,
            y,
            z
        );
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
        entity_id: ctx.sender(),
        region_id,
        dimension_id: session.dimension_id,
        position: next_position.clone(),
        rotation: vec![0.0, 0.0, 0.0, 1.0],
        updated_at: ctx.timestamp,
    };
    if ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender())
        .is_some()
    {
        ctx.db.transform_state().entity_id().update(next_transform);
    } else {
        ctx.db.transform_state().insert(next_transform);
    }

    let previous_physics = ctx.db.physics_state().entity_id().find(ctx.sender());
    let previous_position = previous_physics
        .as_ref()
        .map(|row| vec3_or_zero(&row.position))
        .unwrap_or_else(|| vec3_or_zero(&current_position));
    let previous_client_ts_ms = actor_state
        .as_ref()
        .map(|row| row.last_client_ts_ms)
        .unwrap_or(client_ts_ms.saturating_sub(200));
    let dt_seconds = ((client_ts_ms.saturating_sub(previous_client_ts_ms)) as f32 / 1000.0).max(0.001);
    let velocity = [
        (x - previous_position[0]) / dt_seconds,
        (y - previous_position[1]) / dt_seconds,
        (z - previous_position[2]) / dt_seconds,
    ];
    let next_frame_no = parse_request_sequence(&request_id)
        .map(|seq| {
            previous_physics
                .as_ref()
                .map(|row| seq.max(row.last_frame_no.saturating_add(1)))
                .unwrap_or(seq)
        })
        .unwrap_or_else(|| {
            previous_physics
                .as_ref()
                .map(|row| row.last_frame_no.saturating_add(1))
                .unwrap_or(1)
        });

    let next_physics = PhysicsStateV2 {
        entity_id: ctx.sender(),
        region_id,
        dimension_id: session.dimension_id,
        position: next_position.clone(),
        velocity: velocity.to_vec(),
        grounded: true,
        last_intent_id: request_id.clone(),
        last_frame_no: next_frame_no,
        updated_at: ctx.timestamp,
    };

    if ctx
        .db
        .physics_state()
        .entity_id()
        .find(ctx.sender())
        .is_some()
    {
        ctx.db.physics_state().entity_id().update(next_physics);
    } else {
        ctx.db.physics_state().insert(next_physics);
    }

    ctx.db.movement_request_log().insert(MovementRequestLog {
        request_key: anti_cheat::request_key(ctx.sender(), &request_id),
        identity: ctx.sender(),
        request_id: request_id.clone(),
        region_id,
        client_ts_ms,
        accepted: true,
        processed_at: ctx.timestamp,
    });

    let next_actor_state = MovementActorState {
        identity: ctx.sender(),
        region_id,
        last_client_ts_ms: client_ts_ms,
        last_request_id: request_id.clone(),
        last_position: next_position.clone(),
        updated_at: ctx.timestamp,
    };
    if ctx
        .db
        .movement_actor_state()
        .identity()
        .find(ctx.sender())
        .is_some()
    {
        ctx.db
            .movement_actor_state()
            .identity()
            .update(next_actor_state);
    } else {
        ctx.db.movement_actor_state().insert(next_actor_state);
    }

    projection_views::upsert_movement_feedback(
        ctx,
        ctx.sender(),
        &request_id,
        true,
        "ok",
        next_position,
    );
    log::info!(
        "move_to accepted: identity={} request_id={} region_id={} client_ts_ms={} pos=({},{},{})",
        ctx.sender(),
        request_id,
        region_id,
        client_ts_ms,
        x,
        y,
        z
    );

    Ok(())
}

fn vec3_or_zero(values: &[f32]) -> [f32; 3] {
    [
        values.first().copied().unwrap_or(0.0),
        values.get(1).copied().unwrap_or(0.0),
        values.get(2).copied().unwrap_or(0.0),
    ]
}

fn parse_request_sequence(request_id: &str) -> Option<u64> {
    request_id
        .rsplit(':')
        .next()
        .and_then(|value| value.parse::<u64>().ok())
}
