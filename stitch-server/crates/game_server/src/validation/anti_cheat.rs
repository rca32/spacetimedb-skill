use spacetimedb::{Identity, ReducerContext, Table, Timestamp};

use crate::tables::{MovementActorState, MovementRequestLog, MovementViolation};
use crate::tables::movement::movement_request_log;
use crate::tables::movement::movement_violation;

pub const MOVE_MAX_DISTANCE_PER_STEP: f32 = 8.0;

pub(crate) fn validate_request_id(request_id: &str) -> Result<String, String> {
    let trimmed = request_id.trim();
    if trimmed.is_empty() {
        return Err("request_id must not be empty".to_string());
    }
    if trimmed.len() > 64 {
        return Err("request_id must be <= 64 chars".to_string());
    }
    Ok(trimmed.to_string())
}

pub(crate) fn request_key(identity: Identity, request_id: &str) -> String {
    format!("{identity}:{request_id}")
}

pub(crate) fn is_duplicate_request(ctx: &ReducerContext, request_id: &str) -> bool {
    let req_key = request_key(ctx.sender, request_id);
    ctx.db.movement_request_log().request_key().find(req_key).is_some()
}

pub(crate) fn validate_actor_progression(
    actor_state: Option<MovementActorState>,
    client_ts_ms: u64,
    next_position: &[f32],
) -> Result<(), &'static str> {
    if let Some(existing) = actor_state {
        if client_ts_ms <= existing.last_client_ts_ms {
            return Err("non_monotonic_timestamp");
        }

        let allowed_sq = MOVE_MAX_DISTANCE_PER_STEP * MOVE_MAX_DISTANCE_PER_STEP;
        if distance_sq(&existing.last_position, next_position) > allowed_sq {
            return Err("distance_exceeded");
        }
    }

    Ok(())
}

pub(crate) fn log_movement_violation(
    ctx: &ReducerContext,
    reason: &str,
    position: Vec<f32>,
    request_id: &str,
    region_id: u64,
    client_ts_ms: u64,
) {
    let violation_id = make_violation_id(ctx.sender, ctx.timestamp, reason);
    ctx.db.movement_violation().insert(MovementViolation {
        violation_id,
        identity: ctx.sender,
        reason: reason.to_string(),
        ts: ctx.timestamp,
        attempted_position: position,
    });

    let req_key = request_key(ctx.sender, request_id);
    if ctx.db.movement_request_log().request_key().find(req_key.clone()).is_none() {
        ctx.db.movement_request_log().insert(MovementRequestLog {
            request_key: req_key,
            identity: ctx.sender,
            request_id: request_id.to_string(),
            region_id,
            client_ts_ms,
            accepted: false,
            processed_at: ctx.timestamp,
        });
    }

    log::warn!(
        "movement denied: identity={} reason={} request_id={} region_id={}",
        ctx.sender,
        reason,
        request_id,
        region_id
    );
}

fn make_violation_id(identity: Identity, ts: Timestamp, reason: &str) -> String {
    format!("{identity}:{ts}:{reason}")
}

fn distance_sq(a: &[f32], b: &[f32]) -> f32 {
    let dx = a[0] - b[0];
    let dy = a[1] - b[1];
    let dz = a[2] - b[2];
    dx * dx + dy * dy + dz * dz
}
