use spacetimedb::{ReducerContext, Table};

use crate::tables::QuestStageState;
use crate::tables::npc_quest::quest_chain_state;
use crate::tables::npc_quest::quest_stage_state;

#[spacetimedb::reducer]
pub fn quest_stage_complete(ctx: &ReducerContext, chain_id: u64, stage_index: u32) -> Result<(), String> {
    let chain_key = format!("{}:{}", ctx.sender, chain_id);
    if ctx.db.quest_chain_state().chain_key().find(chain_key.clone()).is_none() {
        return Err("quest chain not started".to_string());
    }

    let stage_key = format!("{}:{}", chain_key, stage_index);
    if let Some(mut stage) = ctx.db.quest_stage_state().stage_key().find(stage_key.clone()) {
        stage.status = 1;
        stage.updated_at = ctx.timestamp;
        ctx.db.quest_stage_state().stage_key().update(stage);
        return Ok(());
    }

    ctx.db.quest_stage_state().insert(QuestStageState {
        stage_key,
        chain_key,
        stage_index,
        status: 1,
        updated_at: ctx.timestamp,
    });

    Ok(())
}
