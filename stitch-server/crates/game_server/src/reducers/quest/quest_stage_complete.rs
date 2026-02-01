use spacetimedb::ReducerContext;

use crate::reducers::quest::get_sender_entity;
use crate::services::{quest_eval, reward_distribute};
use crate::tables::{
    quest_chain_def_trait, quest_chain_state_trait, quest_stage_def_trait, QuestReward,
};

#[spacetimedb::reducer]
pub fn quest_stage_complete(ctx: &ReducerContext, quest_chain_id: u64) -> Result<(), String> {
    let entity_id = get_sender_entity(ctx)?;

    let chain_def = ctx
        .db
        .quest_chain_def()
        .quest_chain_id()
        .find(&quest_chain_id)
        .ok_or("Quest chain not found".to_string())?;

    let mut state = ctx
        .db
        .quest_chain_state()
        .entity_id()
        .filter(&entity_id)
        .find(|s| s.quest_chain_id == quest_chain_id)
        .ok_or("Quest chain state not found".to_string())?;

    if state.completed {
        return Err("Quest chain already completed".to_string());
    }

    let stage_index = state.current_stage_index as usize;
    if stage_index >= chain_def.stages.len() {
        return Err("Invalid stage index".to_string());
    }

    let stage_id = chain_def.stages[stage_index];
    let stage_def = ctx
        .db
        .quest_stage_def()
        .quest_stage_id()
        .find(&stage_id)
        .ok_or("Quest stage not found".to_string())?;

    quest_eval::check_completion_conditions(ctx, entity_id, &stage_def.completion_conditions)?;

    state.current_stage_index += 1;
    if (state.current_stage_index as usize) >= chain_def.stages.len() {
        state.completed = true;
        apply_rewards(ctx, entity_id, &chain_def.rewards)?;
    }

    ctx.db.quest_chain_state().state_id().update(state);

    Ok(())
}

fn apply_rewards(
    ctx: &ReducerContext,
    entity_id: u64,
    rewards: &[QuestReward],
) -> Result<(), String> {
    for reward in rewards {
        reward_distribute::grant_items(ctx, entity_id, &reward.item_rewards)?;
        reward_distribute::grant_skill_rewards(ctx, entity_id, &reward.skill_rewards)?;
    }

    Ok(())
}
