use spacetimedb::{ReducerContext, Table};

use crate::tables::{empire_state_trait, EmpireState};

#[spacetimedb::reducer]
pub fn empire_create(
    ctx: &ReducerContext,
    empire_id: u64,
    capital_building_entity_id: u64,
    name: String,
) -> Result<(), String> {
    if ctx.db.empire_state().entity_id().find(&empire_id).is_some() {
        return Err("Empire already exists".to_string());
    }

    ctx.db.empire_state().insert(EmpireState {
        entity_id: empire_id,
        capital_building_entity_id,
        name,
        shard_treasury: 0,
        nobility_threshold: 0,
        num_claims: 0,
    });

    Ok(())
}
