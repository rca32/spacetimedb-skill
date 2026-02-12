use spacetimedb::{ReducerContext, Table};

use crate::tables::building_state::building_state;

use super::{ensure_nonce, upsert_lease, KIND_BUILDING};

#[spacetimedb::reducer]
pub fn building_next_id(ctx: &ReducerContext, request_nonce: String) -> Result<(), String> {
    let nonce = ensure_nonce(request_nonce)?;
    let leased_id = ctx
        .db
        .building_state()
        .iter()
        .map(|row| row.entity_id)
        .max()
        .unwrap_or(0)
        .saturating_add(1);

    upsert_lease(ctx, KIND_BUILDING, nonce, leased_id);
    Ok(())
}
