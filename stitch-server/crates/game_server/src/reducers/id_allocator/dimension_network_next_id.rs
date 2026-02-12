use spacetimedb::{ReducerContext, Table};

use crate::tables::housing::dimension_network;

use super::{ensure_nonce, upsert_lease, KIND_DIMENSION_NETWORK};

#[spacetimedb::reducer]
pub fn dimension_network_next_id(
    ctx: &ReducerContext,
    request_nonce: String,
) -> Result<(), String> {
    let nonce = ensure_nonce(request_nonce)?;
    let leased_id = ctx
        .db
        .dimension_network()
        .iter()
        .map(|row| row.entity_id)
        .max()
        .unwrap_or(0)
        .saturating_add(1);

    upsert_lease(ctx, KIND_DIMENSION_NETWORK, nonce, leased_id);
    Ok(())
}
