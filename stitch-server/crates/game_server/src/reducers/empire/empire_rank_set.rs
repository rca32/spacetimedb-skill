use spacetimedb::{ReducerContext, Table};

use crate::tables::{empire_rank_state_trait, EmpireRankState};

#[spacetimedb::reducer]
pub fn empire_rank_set(
    ctx: &ReducerContext,
    empire_entity_id: u64,
    rank: u8,
    title: String,
    permissions: Vec<bool>,
) -> Result<(), String> {
    ctx.db.empire_rank_state().insert(EmpireRankState {
        entity_id: ctx.random(),
        empire_entity_id,
        rank,
        title,
        permissions,
    });
    Ok(())
}
