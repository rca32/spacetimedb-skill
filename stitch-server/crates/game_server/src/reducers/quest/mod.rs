use spacetimedb::ReducerContext;

use crate::tables::player_state_trait;

pub mod achievement_acquire;
pub mod quest_chain_start;
pub mod quest_stage_complete;

pub fn get_sender_entity(ctx: &ReducerContext) -> Result<u64, String> {
    let identity = ctx.sender;
    let player = ctx
        .db
        .player_state()
        .identity()
        .filter(&identity)
        .next()
        .ok_or("Player not found".to_string())?;
    Ok(player.entity_id)
}
