use spacetimedb::{ReducerContext, Table};

use crate::tables::housing::housing_state;

use super::{ensure_nonce, upsert_lease, KIND_HOUSING};

#[spacetimedb::reducer]
pub fn housing_next_id(ctx: &ReducerContext, request_nonce: String) -> Result<(), String> {
    let nonce = ensure_nonce(request_nonce)?;
    let leased_id = ctx
        .db
        .housing_state()
        .iter()
        .map(|row| row.entity_id)
        .max()
        .unwrap_or(0)
        .saturating_add(1);

    upsert_lease(ctx, KIND_HOUSING, nonce, leased_id);
    Ok(())
}
