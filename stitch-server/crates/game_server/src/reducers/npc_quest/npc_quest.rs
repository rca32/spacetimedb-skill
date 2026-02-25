use spacetimedb::{ReducerContext, Table};

use crate::tables::npc_quest::npc_interaction_log;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::tables::NpcInteractionLog;

use super::npc_talk::ensure_npc;

const NPC_INTERACTION_RANGE_SQ: i32 = 36;

#[spacetimedb::reducer]
pub fn npc_quest(ctx: &ReducerContext, npc_id: u64, request_id: String) -> Result<(), String> {
    let req = request_id.trim();
    if req.is_empty() {
        return Err("request_id must not be empty".to_string());
    }

    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender())
        .ok_or("active session required".to_string())?;
    let caller_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender())
        .ok_or("caller transform missing".to_string())?;
    if caller_tf.region_id != session.region_id || caller_tf.dimension_id != session.dimension_id {
        return Err("caller transform/session mismatch".to_string());
    }

    let npc = ensure_npc(
        ctx,
        npc_id,
        session.region_id,
        session.dimension_id,
        &caller_tf.position,
    )?;
    let caller_hex_x = caller_tf.position.first().copied().unwrap_or(0.0).round() as i32;
    let caller_hex_z = caller_tf.position.get(2).copied().unwrap_or(0.0).round() as i32;
    let dx = caller_hex_x - npc.hex_x;
    let dz = caller_hex_z - npc.hex_z;
    if dx * dx + dz * dz > NPC_INTERACTION_RANGE_SQ {
        return Err("npc is too far for quest".to_string());
    }

    let interaction_key = format!("quest:{}:{}", ctx.sender(), req);
    if ctx
        .db
        .npc_interaction_log()
        .interaction_key()
        .find(interaction_key.clone())
        .is_some()
    {
        return Ok(());
    }

    ctx.db.npc_interaction_log().insert(NpcInteractionLog {
        interaction_key,
        npc_id,
        caller_identity: ctx.sender(),
        interaction_kind: 3,
        status: 1,
        detail: "quest dialog accepted".to_string(),
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    Ok(())
}
