use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::nav::build_nav_grid;
use crate::tables::v2::{
    aoi_stream, audio_event, client_frame, collision_proxy, combat_hit, combat_hit_event,
    combat_intent, fx_event, motion_intent, physics_state, server_correction,
    ui_notification_event,
};
use crate::tables::{
    AoiStreamV2, AudioEventV2, ClientFrameV2, CollisionProxyV2, CombatHitEventV2, CombatHitV2,
    CombatIntentV2, FxEventV2, MotionIntentV2, PhysicsStateV2, ServerCorrectionV2,
    UiNotificationEventV2,
};

const PHYSICS_DT_SECONDS: f32 = 1.0 / 60.0;
const MAX_REQUESTED_SPEED: f32 = 14.0;
const MAX_DISTANCE_PER_TICK: f32 = 0.5;
const MAX_FRAME_STEP: u64 = 12;
const PLAYER_HALF_EXTENT: f32 = 0.45;
const CHUNK_SIZE_METERS: f32 = 32.0;
const PLAYER_FEET_OFFSET_Y: f32 = 0.9;
const KINEMATIC_MAX_STEP_HEIGHT_METERS: f32 = 0.45;
const KINEMATIC_MAX_SLOPE_DEGREES: f32 = 42.0;

#[spacetimedb::reducer]
pub fn sync_client_frame(
    ctx: &ReducerContext,
    frame_no: u64,
    region_id: u64,
    dimension_id: u32,
    client_time_ms: u64,
) -> Result<(), String> {
    if frame_no == 0 {
        return Err("frame_no must be > 0".to_string());
    }
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }

    let key = frame_key(ctx.sender(), frame_no);
    let row = ClientFrameV2 {
        frame_key: key.clone(),
        identity: ctx.sender(),
        region_id,
        dimension_id,
        frame_no,
        client_time_ms,
        received_at: ctx.timestamp,
    };

    if ctx.db.client_frame().frame_key().find(key).is_some() {
        ctx.db.client_frame().frame_key().update(row);
    } else {
        ctx.db.client_frame().insert(row);
    }

    ensure_physics_state(ctx, ctx.sender(), region_id, dimension_id, frame_no);
    Ok(())
}

#[spacetimedb::reducer]
pub fn submit_motion_intent(
    ctx: &ReducerContext,
    intent_id: String,
    region_id: u64,
    dimension_id: u32,
    frame_no: u64,
    input_x: f32,
    input_z: f32,
    requested_speed: f32,
    jump: bool,
) -> Result<(), String> {
    if intent_id.trim().is_empty() {
        return Err("intent_id cannot be empty".to_string());
    }
    if frame_no == 0 {
        return Err("frame_no must be > 0".to_string());
    }
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }
    if !input_x.is_finite() || !input_z.is_finite() || !requested_speed.is_finite() {
        return Err("motion intent contains non-finite value".to_string());
    }

    let speed = requested_speed.clamp(0.0, MAX_REQUESTED_SPEED);

    if ctx
        .db
        .motion_intent()
        .intent_id()
        .find(intent_id.clone())
        .is_some()
    {
        return Ok(());
    }

    ctx.db.motion_intent().insert(MotionIntentV2 {
        intent_id: intent_id.clone(),
        identity: ctx.sender(),
        region_id,
        dimension_id,
        frame_no,
        input_x,
        input_z,
        requested_speed: speed,
        jump,
        submitted_at: ctx.timestamp,
    });

    let current = ctx
        .db
        .physics_state()
        .entity_id()
        .find(ctx.sender())
        .unwrap_or_else(|| {
            default_physics_state(ctx.sender(), region_id, dimension_id, frame_no, ctx.timestamp)
        });

    let current_position = vec3_or_zero(&current.position);
    // The client may send intents at a lower cadence than render FPS.
    // Integrate using frame delta so server motion speed matches client intent speed.
    let frame_step = frame_no
        .saturating_sub(current.last_frame_no)
        .clamp(1, MAX_FRAME_STEP);
    let step_dt = PHYSICS_DT_SECONDS * (frame_step as f32);

    let (dir_x, dir_z) = normalize_2d(input_x, input_z);
    let velocity_x = dir_x * speed;
    let velocity_z = dir_z * speed;

    let mut proposed_position = current_position;
    proposed_position[0] += velocity_x * step_dt;
    proposed_position[2] += velocity_z * step_dt;

    let nav = build_nav_grid(ctx, region_id, dimension_id);
    let mut next_position = proposed_position;
    let mut next_velocity = [velocity_x, 0.0, velocity_z];
    let mut correction_reason: Option<&'static str> = None;

    match nav.validate_kinematic_transition_positions(
        dimension_id,
        &current_position,
        &proposed_position,
        KINEMATIC_MAX_STEP_HEIGHT_METERS,
        KINEMATIC_MAX_SLOPE_DEGREES,
    ) {
        Ok(ground_height) => {
            next_position[1] = ground_height + PLAYER_FEET_OFFSET_Y;
        }
        Err(reason) => {
            correction_reason = Some(reason);
            next_position = current_position;
            next_velocity = [0.0, 0.0, 0.0];
        }
    }

    let distance = ((next_position[0] - current_position[0]).powi(2)
        + (next_position[2] - current_position[2]).powi(2))
    .sqrt();

    let next_state = PhysicsStateV2 {
        entity_id: ctx.sender(),
        region_id,
        dimension_id,
        position: next_position.to_vec(),
        velocity: next_velocity.to_vec(),
        grounded: correction_reason.is_some() || !jump,
        last_intent_id: intent_id.clone(),
        last_frame_no: frame_no,
        updated_at: ctx.timestamp,
    };

    if ctx
        .db
        .physics_state()
        .entity_id()
        .find(ctx.sender())
        .is_some()
    {
        ctx.db.physics_state().entity_id().update(next_state);
    } else {
        ctx.db.physics_state().insert(next_state);
    }

    upsert_player_proxy(
        ctx,
        ctx.sender(),
        region_id,
        dimension_id,
        next_position,
        frame_no,
    );
    upsert_aoi_player(ctx, ctx.sender(), region_id, dimension_id, next_position);

    if let Some(reason) = correction_reason {
        let correction_id = format!("{}:{}:{reason}", intent_id, frame_no);
        upsert_server_correction(
            ctx,
            correction_id,
            ctx.sender(),
            region_id,
            dimension_id,
            reason,
            next_position,
            next_velocity,
        );
        return Ok(());
    }

    let max_distance_for_step = MAX_DISTANCE_PER_TICK * (frame_step as f32);
    if distance > max_distance_for_step {
        let correction_id = format!("{}:{}:speed", intent_id, frame_no);
        upsert_server_correction(
            ctx,
            correction_id,
            ctx.sender(),
            region_id,
            dimension_id,
            "speed_audit_soft",
            next_position,
            next_velocity,
        );
    }

    Ok(())
}

#[spacetimedb::reducer]
pub fn submit_combat_intent(
    ctx: &ReducerContext,
    intent_id: String,
    target: Identity,
    region_id: u64,
    dimension_id: u32,
    frame_no: u64,
    skill_slot: u8,
    client_time_ms: u64,
) -> Result<(), String> {
    if intent_id.trim().is_empty() {
        return Err("intent_id cannot be empty".to_string());
    }
    if frame_no == 0 {
        return Err("frame_no must be > 0".to_string());
    }
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }

    if ctx
        .db
        .combat_intent()
        .intent_id()
        .find(intent_id.clone())
        .is_some()
    {
        return Ok(());
    }

    ctx.db.combat_intent().insert(CombatIntentV2 {
        intent_id: intent_id.clone(),
        attacker: ctx.sender(),
        target,
        region_id,
        dimension_id,
        frame_no,
        skill_slot,
        client_time_ms,
        submitted_at: ctx.timestamp,
    });

    let hit_id = format!("{}:impact", intent_id);
    let damage = 10 + (u32::from(skill_slot) * 2);
    let crit = frame_no % 7 == 0;

    ctx.db.combat_hit().insert(CombatHitV2 {
        hit_id: hit_id.clone(),
        attacker: ctx.sender(),
        target,
        region_id,
        dimension_id,
        frame_no,
        skill_slot,
        damage,
        crit,
        resolved_at: ctx.timestamp,
    });
    ctx.db.combat_hit_event().insert(CombatHitEventV2 {
        event_id: format!("combat-hit:{hit_id}"),
        attacker: ctx.sender(),
        target,
        damage,
        crit,
        emitted_at: ctx.timestamp,
    });
    ctx.db.fx_event().insert(FxEventV2 {
        event_id: format!("fx:{hit_id}"),
        region_id,
        dimension_id,
        event_type: if crit {
            "combat.crit".to_string()
        } else {
            "combat.hit".to_string()
        },
        payload_json: format!(
            "{{\"hit_id\":\"{}\",\"skill_slot\":{},\"damage\":{},\"crit\":{}}}",
            hit_id, skill_slot, damage, crit
        ),
        emitted_at: ctx.timestamp,
    });
    ctx.db.audio_event().insert(AudioEventV2 {
        event_id: format!("audio:{hit_id}"),
        region_id,
        dimension_id,
        event_type: if crit {
            "combat.crit".to_string()
        } else {
            "combat.hit".to_string()
        },
        payload_json: format!(
            "{{\"hit_id\":\"{}\",\"skill_slot\":{},\"damage\":{},\"crit\":{}}}",
            hit_id, skill_slot, damage, crit
        ),
        emitted_at: ctx.timestamp,
    });

    let aoi_key = format!("combat:{}", hit_id);
    let payload = damage.to_le_bytes().to_vec();

    ctx.db.aoi_stream().insert(AoiStreamV2 {
        stream_key: aoi_key,
        region_id,
        dimension_id,
        chunk_x: 0,
        chunk_y: 0,
        entity_type: 9,
        entity_key: ctx.sender().to_string(),
        position: vec![0.0, 0.0, 0.0],
        payload,
        updated_at: ctx.timestamp,
    });

    Ok(())
}

#[spacetimedb::reducer]
pub fn ack_server_correction(
    ctx: &ReducerContext,
    correction_id: String,
    acked_client_frame_no: u64,
) -> Result<(), String> {
    if correction_id.trim().is_empty() {
        return Err("correction_id cannot be empty".to_string());
    }

    let current = ctx
        .db
        .server_correction()
        .correction_id()
        .find(correction_id.clone())
        .ok_or_else(|| format!("correction not found: {correction_id}"))?;

    if current.identity != ctx.sender() {
        return Err("correction does not belong to sender".to_string());
    }

    ctx.db
        .server_correction()
        .correction_id()
        .update(ServerCorrectionV2 {
            correction_id: correction_id.clone(),
            identity: current.identity,
            region_id: current.region_id,
            dimension_id: current.dimension_id,
            reason: current.reason,
            server_x: current.server_x,
            server_y: current.server_y,
            server_z: current.server_z,
            velocity_x: current.velocity_x,
            velocity_y: current.velocity_y,
            velocity_z: current.velocity_z,
            created_at: current.created_at,
            acknowledged: true,
            acked_client_frame_no,
            acked_at: ctx.timestamp,
        });
    ctx.db.ui_notification_event().insert(UiNotificationEventV2 {
        event_id: format!("ui-notify:{}:{acked_client_frame_no}", correction_id),
        identity: current.identity,
        code: "server_correction_acked".to_string(),
        payload_json: format!(
            "{{\"correction_id\":\"{}\",\"acked_client_frame_no\":{}}}",
            correction_id, acked_client_frame_no
        ),
        emitted_at: ctx.timestamp,
    });

    Ok(())
}

fn ensure_physics_state(
    ctx: &ReducerContext,
    entity_id: Identity,
    region_id: u64,
    dimension_id: u32,
    frame_no: u64,
) {
    if ctx
        .db
        .physics_state()
        .entity_id()
        .find(entity_id)
        .is_some()
    {
        return;
    }

    ctx.db.physics_state().insert(default_physics_state(
        entity_id,
        region_id,
        dimension_id,
        frame_no,
        ctx.timestamp,
    ));
}

fn default_physics_state(
    entity_id: Identity,
    region_id: u64,
    dimension_id: u32,
    frame_no: u64,
    updated_at: spacetimedb::Timestamp,
) -> PhysicsStateV2 {
    PhysicsStateV2 {
        entity_id,
        region_id,
        dimension_id,
        position: vec![0.0, 0.0, 0.0],
        velocity: vec![0.0, 0.0, 0.0],
        grounded: true,
        last_intent_id: String::new(),
        last_frame_no: frame_no,
        updated_at,
    }
}

fn upsert_player_proxy(
    ctx: &ReducerContext,
    identity: Identity,
    region_id: u64,
    dimension_id: u32,
    position: [f32; 3],
    frame_no: u64,
) {
    let proxy_id = format!("player:{identity}");
    let next = CollisionProxyV2 {
        proxy_id: proxy_id.clone(),
        owner_key: identity.to_string(),
        region_id,
        dimension_id,
        min_x: position[0] - PLAYER_HALF_EXTENT,
        min_y: position[1],
        min_z: position[2] - PLAYER_HALF_EXTENT,
        max_x: position[0] + PLAYER_HALF_EXTENT,
        max_y: position[1] + 1.8,
        max_z: position[2] + PLAYER_HALF_EXTENT,
        layer: 1,
        is_trigger: false,
        updated_at: ctx.timestamp,
    };

    if ctx
        .db
        .collision_proxy()
        .proxy_id()
        .find(proxy_id)
        .is_some()
    {
        ctx.db.collision_proxy().proxy_id().update(next);
    } else {
        ctx.db.collision_proxy().insert(next);
    }

    let _ = frame_no;
}

fn upsert_aoi_player(
    ctx: &ReducerContext,
    identity: Identity,
    region_id: u64,
    dimension_id: u32,
    position: [f32; 3],
) {
    let chunk_x = (position[0] / CHUNK_SIZE_METERS).floor() as i32;
    let chunk_y = (position[2] / CHUNK_SIZE_METERS).floor() as i32;

    let stream_key = format!("player:{identity}");
    let next = AoiStreamV2 {
        stream_key: stream_key.clone(),
        region_id,
        dimension_id,
        chunk_x,
        chunk_y,
        entity_type: 1,
        entity_key: identity.to_string(),
        position: position.to_vec(),
        payload: Vec::new(),
        updated_at: ctx.timestamp,
    };

    if ctx
        .db
        .aoi_stream()
        .stream_key()
        .find(stream_key)
        .is_some()
    {
        ctx.db.aoi_stream().stream_key().update(next);
    } else {
        ctx.db.aoi_stream().insert(next);
    }
}

fn upsert_server_correction(
    ctx: &ReducerContext,
    correction_id: String,
    identity: Identity,
    region_id: u64,
    dimension_id: u32,
    reason: &str,
    server_position: [f32; 3],
    server_velocity: [f32; 3],
) {
    let row = ServerCorrectionV2 {
        correction_id: correction_id.clone(),
        identity,
        region_id,
        dimension_id,
        reason: reason.to_string(),
        server_x: server_position[0],
        server_y: server_position[1],
        server_z: server_position[2],
        velocity_x: server_velocity[0],
        velocity_y: server_velocity[1],
        velocity_z: server_velocity[2],
        created_at: ctx.timestamp,
        acknowledged: false,
        acked_client_frame_no: 0,
        acked_at: ctx.timestamp,
    };

    if ctx
        .db
        .server_correction()
        .correction_id()
        .find(correction_id.clone())
        .is_some()
    {
        ctx.db.server_correction().correction_id().update(row);
    } else {
        ctx.db.server_correction().insert(row);
    }
    ctx.db.ui_notification_event().insert(UiNotificationEventV2 {
        event_id: format!("ui-notify:{}:issued", correction_id),
        identity,
        code: "server_correction_issued".to_string(),
        payload_json: format!(
            "{{\"correction_id\":\"{}\",\"reason\":\"{}\",\"region_id\":{},\"dimension_id\":{}}}",
            correction_id, reason, region_id, dimension_id
        ),
        emitted_at: ctx.timestamp,
    });
}

fn frame_key(identity: Identity, frame_no: u64) -> String {
    format!("{identity}:{frame_no}")
}

fn vec3_or_zero(values: &[f32]) -> [f32; 3] {
    [
        values.first().copied().unwrap_or(0.0),
        values.get(1).copied().unwrap_or(0.0),
        values.get(2).copied().unwrap_or(0.0),
    ]
}

fn normalize_2d(x: f32, z: f32) -> (f32, f32) {
    let length_sq = x * x + z * z;
    if length_sq <= f32::EPSILON {
        return (0.0, 0.0);
    }
    let inv_length = length_sq.sqrt().recip();
    (x * inv_length, z * inv_length)
}
