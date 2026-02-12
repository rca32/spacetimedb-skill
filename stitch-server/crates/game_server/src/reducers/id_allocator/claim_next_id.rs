use spacetimedb::{ReducerContext, Table};

use crate::tables::claim_state::claim_state;

use super::{ensure_nonce, upsert_lease, KIND_CLAIM};

#[spacetimedb::reducer]
pub fn claim_next_id(ctx: &ReducerContext, request_nonce: String) -> Result<(), String> {
    let nonce = ensure_nonce(request_nonce)?;
    let leased_id = ctx
        .db
        .claim_state()
        .iter()
        .map(|row| row.claim_id)
        .max()
        .unwrap_or(0)
        .saturating_add(1);

    upsert_lease(ctx, KIND_CLAIM, nonce, leased_id);
    Ok(())
}
