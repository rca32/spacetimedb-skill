use spacetimedb::{ReducerContext, Table};

use crate::tables::QuestChainState;
use crate::tables::npc_quest::quest_chain_state;

#[spacetimedb::reducer]
pub fn quest_chain_start(ctx: &ReducerContext, chain_id: u64) -> Result<(), String> {
    let chain_key = format!("{}:{}", ctx.sender, chain_id);
    if ctx
        .db
        .quest_chain_state()
        .chain_key()
        .find(chain_key.clone())
        .is_some()
    {
        return Ok(());
    }

    ctx.db.quest_chain_state().insert(QuestChainState {
        chain_key,
        identity: ctx.sender,
        chain_id,
        status: 0,
        started_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    Ok(())
}
