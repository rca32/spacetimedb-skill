use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::services::quest_eval;
use crate::tables::{quest_chain_def_trait, quest_chain_state_trait, QuestChainState};

#[spacetimedb::reducer]
pub fn quest_chain_start(ctx: &ReducerContext, quest_chain_id: u64) -> Result<(), String> {
    let entity_id = get_sender_entity(ctx)?;

    let chain_def = ctx
        .db
        .quest_chain_def()
        .quest_chain_id()
        .find(&quest_chain_id)
        .ok_or("Quest chain not found".to_string())?;

    if ctx
        .db
        .quest_chain_state()
        .entity_id()
        .filter(&entity_id)
        .find(|state| state.quest_chain_id == quest_chain_id && state.completed)
        .is_some()
    {
        return Err("Quest chain already completed".to_string());
    }

    quest_eval::check_requirements(ctx, entity_id, &chain_def.requirements)?;

    let existing_state = ctx
        .db
        .quest_chain_state()
        .entity_id()
        .filter(&entity_id)
        .find(|state| state.quest_chain_id == quest_chain_id);

    if let Some(mut state) = existing_state {
        if state.completed {
            return Err("Quest chain already completed".to_string());
        }
        if state.current_stage_index < 0 {
            state.current_stage_index = 0;
        }
        ctx.db.quest_chain_state().state_id().update(state);
        return Ok(());
    }

    ctx.db.quest_chain_state().insert(QuestChainState {
        state_id: 0,
        entity_id,
        quest_chain_id,
        completed: false,
        current_stage_index: 0,
    });

    Ok(())
}
