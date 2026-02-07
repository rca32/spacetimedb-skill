use spacetimedb::{ReducerContext, Table};

use crate::tables::{NpcInteractionLog, NpcState};
use crate::tables::npc_quest::npc_interaction_log;
use crate::tables::npc_quest::npc_state;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;

const NPC_INTERACTION_RANGE_SQ: f32 = 100.0;

#[spacetimedb::reducer]
pub fn npc_talk(ctx: &ReducerContext, npc_id: u64, request_id: String) -> Result<(), String> {
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
        return Err("npc is too far to talk".to_string());
    }

    let interaction_key = format!("talk:{}:{}", ctx.sender, req);
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
        interaction_kind: 1,
        status: 1,
        detail: "talk accepted".to_string(),
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    Ok(())
}

pub(crate) fn ensure_npc(
    ctx: &ReducerContext,
    npc_id: u64,
    region_id: u64,
    fallback_pos: &[f32],
) -> NpcState {
    if let Some(npc) = ctx.db.npc_state().npc_id().find(npc_id) {
        return npc;
    }

    let npc = NpcState {
        npc_id,
        region_id,
        pos_x: fallback_pos.first().copied().unwrap_or(0.0),
        pos_z: fallback_pos.get(2).copied().unwrap_or(0.0),
        schedule_kind: 1,
        updated_at: ctx.timestamp,
    };
    ctx.db.npc_state().insert(NpcState {
        npc_id: npc.npc_id,
        region_id: npc.region_id,
        pos_x: npc.pos_x,
        pos_z: npc.pos_z,
        schedule_kind: npc.schedule_kind,
        updated_at: npc.updated_at,
    });
    npc
}
