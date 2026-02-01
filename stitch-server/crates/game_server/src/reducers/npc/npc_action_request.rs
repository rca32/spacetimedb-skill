use spacetimedb::{ReducerContext, Table};

use crate::tables::{npc_action_request_trait, npc_state_trait, NpcActionRequest};

#[spacetimedb::reducer]
pub fn npc_action_request_reducer(
    ctx: &ReducerContext,
    npc_id: u64,
    action_type: u8,
    payload: String,
) -> Result<(), String> {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    if ctx.db.npc_state().npc_id().find(&npc_id).is_none() {
        return Err("Npc not found".to_string());
    }

    ctx.db.npc_action_request().insert(NpcActionRequest {
        request_id: ctx.random(),
        npc_id,
        action_type,
        payload,
        created_at: now,
    });

    Ok(())
}
