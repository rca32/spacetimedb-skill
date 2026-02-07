use spacetimedb::{ReducerContext, Table};

use crate::tables::NpcInteractionLog;
use crate::tables::npc_quest::npc_interaction_log;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;

use super::npc_talk::ensure_npc;

const NPC_INTERACTION_RANGE_SQ: f32 = 100.0;

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
        .find(ctx.sender)
        .ok_or("active session required".to_string())?;
    let caller_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender)
        .ok_or("caller transform missing".to_string())?;

    let npc = ensure_npc(ctx, npc_id, session.region_id, &caller_tf.position);
    let dx = caller_tf.position[0] - npc.pos_x;
    let dz = caller_tf.position[2] - npc.pos_z;
    if dx * dx + dz * dz > NPC_INTERACTION_RANGE_SQ {
        return Err("npc is too far for quest".to_string());
    }

    let interaction_key = format!("quest:{}:{}", ctx.sender, req);
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
        caller_identity: ctx.sender,
        interaction_kind: 3,
        status: 1,
        detail: "quest dialog accepted".to_string(),
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    Ok(())
}
