use spacetimedb::ReducerContext;

use crate::tables::npc_conversation_session_trait;

#[spacetimedb::reducer]
pub fn npc_conversation_end(ctx: &ReducerContext, session_id: u64) -> Result<(), String> {
    ctx.db
        .npc_conversation_session()
        .session_id()
        .delete(&session_id);
    Ok(())
}
