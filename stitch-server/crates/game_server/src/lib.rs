use spacetimedb::{Identity, ReducerContext, Table, Timestamp};

const MOVE_MAX_DISTANCE_PER_STEP: f32 = 8.0;

#[spacetimedb::table(name = account, public)]
pub struct Account {
    #[primary_key]
    pub identity: Identity,
    pub created_at: Timestamp,
    pub status: u8, // 0: active, 1: blocked
}

#[spacetimedb::table(name = item_def, public)]
pub struct ItemDef {
    #[primary_key]
    pub id: u64,
    pub code: String,
    pub name: String,
    pub stackable: bool,
    pub max_stack: u32,
}

#[spacetimedb::table(name = player_state, public)]
pub struct PlayerState {
    #[primary_key]
    pub player_id: Identity,
    pub display_name: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = session_state, private)]
pub struct SessionState {
    #[primary_key]
    pub identity: Identity,
    pub region_id: u64,
    pub last_active_at: Timestamp,
}

#[spacetimedb::table(name = transform_state, public)]
pub struct TransformState {
    #[primary_key]
    pub entity_id: Identity,
    pub region_id: u64,
    pub position: Vec<f32>,
    pub rotation: Vec<f32>,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = movement_violation, private)]
pub struct MovementViolation {
    #[primary_key]
    pub violation_id: String,
    pub identity: Identity,
    pub reason: String,
    pub ts: Timestamp,
    pub attempted_position: Vec<f32>,
}

#[spacetimedb::table(name = movement_request_log, private)]
pub struct MovementRequestLog {
    #[primary_key]
    pub request_key: String,
    pub identity: Identity,
    pub request_id: String,
    pub region_id: u64,
    pub client_ts_ms: u64,
    pub accepted: bool,
    pub processed_at: Timestamp,
}

#[spacetimedb::table(name = movement_actor_state, private)]
pub struct MovementActorState {
    #[primary_key]
    pub identity: Identity,
    pub region_id: u64,
    pub last_client_ts_ms: u64,
    pub last_request_id: String,
    pub last_position: Vec<f32>,
    pub updated_at: Timestamp,
}

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    log::info!("stitch-server module initialized");
}

fn ensure_account_exists(ctx: &ReducerContext) {
    if ctx.db.account().identity().find(ctx.sender).is_none() {
        ctx.db.account().insert(Account {
            identity: ctx.sender,
            created_at: ctx.timestamp,
            status: 0,
        });
    }
}

fn ensure_player_state_exists(ctx: &ReducerContext, display_name: String) {
    if ctx.db.player_state().player_id().find(ctx.sender).is_none() {
        ctx.db.player_state().insert(PlayerState {
            player_id: ctx.sender,
            display_name,
            created_at: ctx.timestamp,
        });
    }
}

fn request_key(identity: Identity, request_id: &str) -> String {
    format!("{identity}:{request_id}")
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

fn log_movement_violation(
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

fn ensure_transform_exists(ctx: &ReducerContext, region_id: u64) {
    if ctx.db.transform_state().entity_id().find(ctx.sender).is_none() {
        ctx.db.transform_state().insert(TransformState {
            entity_id: ctx.sender,
            region_id,
            position: vec![0.0, 0.0, 0.0],
            rotation: vec![0.0, 0.0, 0.0, 1.0],
            updated_at: ctx.timestamp,
        });
    }
}

#[spacetimedb::reducer(client_connected)]
pub fn identity_connected(ctx: &ReducerContext) {
    ensure_account_exists(ctx);
    ensure_player_state_exists(ctx, "new-player".to_string());
}

#[spacetimedb::reducer]
pub fn seed_data(ctx: &ReducerContext) {
    if ctx.db.item_def().id().find(1).is_none() {
        ctx.db.item_def().insert(ItemDef {
            id: 1,
            code: "wood".to_string(),
            name: "Wood".to_string(),
            stackable: true,
            max_stack: 200,
        });
    }

    if ctx.db.item_def().id().find(2).is_none() {
        ctx.db.item_def().insert(ItemDef {
            id: 2,
            code: "stone".to_string(),
            name: "Stone".to_string(),
            stackable: true,
            max_stack: 200,
        });
    }

    log::info!("seed_data complete");
}

#[spacetimedb::reducer]
pub fn import_csv_data(ctx: &ReducerContext) {
    // Bootstrap stage: alias to seed path so CLI flow stays stable.
    seed_data(ctx);
}

#[spacetimedb::reducer]
pub fn import_csv_by_type(ctx: &ReducerContext, data_type: String) -> Result<(), String> {
    match data_type.as_str() {
        "items" => {
            seed_data(ctx);
            Ok(())
        }
        _ => Err(format!("unsupported import type: {data_type}")),
    }
}

#[spacetimedb::reducer]
pub fn account_bootstrap(ctx: &ReducerContext, display_name: String) -> Result<(), String> {
    let trimmed = display_name.trim();
    if trimmed.is_empty() {
        return Err("display_name must not be empty".to_string());
    }

    ensure_account_exists(ctx);
    ensure_player_state_exists(ctx, trimmed.to_string());
    Ok(())
}

#[spacetimedb::reducer]
pub fn sign_in(ctx: &ReducerContext, region_id: u64) -> Result<(), String> {
    ensure_account_exists(ctx);

    let account = ctx
        .db
        .account()
        .identity()
        .find(ctx.sender)
        .ok_or("account not found".to_string())?;

    if account.status != 0 {
        log::warn!("blocked sign_in attempt: identity={}", ctx.sender);
        return Err("account blocked".to_string());
    }

    let next_state = SessionState {
        identity: ctx.sender,
        region_id,
        last_active_at: ctx.timestamp,
    };

    if ctx.db.session_state().identity().find(ctx.sender).is_some() {
        ctx.db.session_state().identity().update(next_state);
    } else {
        ctx.db.session_state().insert(next_state);
    }

    ensure_player_state_exists(ctx, "new-player".to_string());
    ensure_transform_exists(ctx, region_id);
    Ok(())
}

#[spacetimedb::reducer]
pub fn sign_out(ctx: &ReducerContext) -> Result<(), String> {
    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender)
        .ok_or("active session not found".to_string())?;

    if session.identity != ctx.sender {
        log::warn!("unauthorized sign_out attempt: identity={}", ctx.sender);
        return Err("unauthorized".to_string());
    }

    ctx.db.session_state().identity().delete(ctx.sender);
    Ok(())
}

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
    let request_id = request_id.trim();
    if request_id.is_empty() {
        return Err("request_id must not be empty".to_string());
    }

    if request_id.len() > 64 {
        return Err("request_id must be <= 64 chars".to_string());
    }

    let next_position = vec![x, y, z];
    if !x.is_finite() || !y.is_finite() || !z.is_finite() {
        log_movement_violation(
            ctx,
            "invalid_position",
            next_position,
            request_id,
            region_id,
            client_ts_ms,
        );
        return Ok(());
    }

    let req_key = request_key(ctx.sender, request_id);
    if ctx.db.movement_request_log().request_key().find(req_key).is_some() {
        // Idempotent duplicate: no re-apply, no additional side effects.
        return Ok(());
    }

    let session = match ctx.db.session_state().identity().find(ctx.sender) {
        Some(session) => session,
        None => {
            log_movement_violation(
                ctx,
                "missing_session",
                next_position,
                request_id,
                region_id,
                client_ts_ms,
            );
            return Ok(());
        }
    };

    if session.region_id != region_id {
        log_movement_violation(
            ctx,
            "region_mismatch",
            next_position,
            request_id,
            region_id,
            client_ts_ms,
        );
        return Ok(());
    }

    let actor_state = ctx.db.movement_actor_state().identity().find(ctx.sender);
    if let Some(existing) = actor_state {
        if client_ts_ms <= existing.last_client_ts_ms {
            log_movement_violation(
                ctx,
                "non_monotonic_timestamp",
                next_position,
                request_id,
                region_id,
                client_ts_ms,
            );
            return Ok(());
        }

        let allowed_sq = MOVE_MAX_DISTANCE_PER_STEP * MOVE_MAX_DISTANCE_PER_STEP;
        if distance_sq(&existing.last_position, &next_position) > allowed_sq {
            log_movement_violation(
                ctx,
                "distance_exceeded",
                next_position,
                request_id,
                region_id,
                client_ts_ms,
            );
            return Ok(());
        }
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
        request_key: request_key(ctx.sender, request_id),
        identity: ctx.sender,
        request_id: request_id.to_string(),
        region_id,
        client_ts_ms,
        accepted: true,
        processed_at: ctx.timestamp,
    });

    let next_actor_state = MovementActorState {
        identity: ctx.sender,
        region_id,
        last_client_ts_ms: client_ts_ms,
        last_request_id: request_id.to_string(),
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
