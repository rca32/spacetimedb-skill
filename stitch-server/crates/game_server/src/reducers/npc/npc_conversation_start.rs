use spacetimedb::{ReducerContext, Table};

use crate::tables::{npc_conversation_session_trait, npc_state_trait, NpcConversationSession};

#[spacetimedb::reducer]
pub fn npc_conversation_start(
    ctx: &ReducerContext,
    npc_id: u64,
    player_entity_id: u64,
    is_private: bool,
) -> Result<(), String> {
    if ctx.db.npc_state().npc_id().find(&npc_id).is_none() {
        return Err("Npc not found".to_string());
    }

    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    ctx.db
        .npc_conversation_session()
        .insert(NpcConversationSession {
            session_id: ctx.random(),
            npc_id,
            player_entity_id,
            started_at: now,
            last_ts: now,
            is_private,
        });

    Ok(())
}
