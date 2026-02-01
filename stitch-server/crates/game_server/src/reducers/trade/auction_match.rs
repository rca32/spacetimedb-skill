use spacetimedb::ReducerContext;

use crate::services::auction_match;

#[spacetimedb::reducer]
pub fn auction_match_orders(
    ctx: &ReducerContext,
    item_def_id: u64,
    claim_entity_id: u64,
) -> Result<(), String> {
    auction_match::match_orders(ctx, item_def_id, claim_entity_id)?;
    Ok(())
}
