use spacetimedb::{ReducerContext, Table};

use crate::tables::{empire_node_state_trait, EmpireNodeState};

#[spacetimedb::reducer]
pub fn empire_node_register(
    ctx: &ReducerContext,
    empire_entity_id: u64,
    chunk_index: u64,
    energy: i32,
    upkeep: i32,
) -> Result<(), String> {
    ctx.db.empire_node_state().insert(EmpireNodeState {
        entity_id: ctx.random(),
        empire_entity_id,
        chunk_index,
        energy,
        active: true,
        upkeep,
    });
    Ok(())
}
