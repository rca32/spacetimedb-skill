use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    npc_conversation_session_trait, npc_conversation_turn_trait, NpcConversationTurn,
};

#[spacetimedb::reducer]
pub fn npc_conversation_turn_reducer(
    ctx: &ReducerContext,
    session_id: u64,
    npc_id: u64,
    speaker_entity_id: u64,
    summary: String,
) -> Result<(), String> {
    let mut session = ctx
        .db
        .npc_conversation_session()
        .session_id()
        .find(&session_id)
        .ok_or("Session not found".to_string())?;

    if session.npc_id != npc_id {
        return Err("Npc mismatch".to_string());
    }

    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_id: ctx.random(),
        session_id,
        npc_id,
        speaker_entity_id,
        summary,
        created_at: now,
    });

    session.last_ts = now;
    ctx.db
        .npc_conversation_session()
        .session_id()
        .update(session);

    Ok(())
}
