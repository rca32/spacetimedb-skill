use spacetimedb::{ReducerContext, Table};

use crate::reducers::trade::get_sender_entity;
use crate::tables::{auction_order_trait, AuctionOrder};

#[spacetimedb::reducer]
pub fn auction_create_order(
    ctx: &ReducerContext,
    order_type: u8,
    item_def_id: u64,
    item_type: u8,
    price_threshold: i32,
    quantity: i32,
    claim_entity_id: u64,
) -> Result<(), String> {
    if quantity <= 0 {
        return Err("Quantity must be positive".to_string());
    }

    let owner_entity_id = get_sender_entity(ctx)?;
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let stored_coins = if order_type == 0 {
        price_threshold.saturating_mul(quantity)
    } else {
        0
    };

    ctx.db.auction_order().insert(AuctionOrder {
        order_id: now + owner_entity_id,
        owner_entity_id,
        claim_entity_id,
        order_type,
        item_def_id,
        item_type,
        price_threshold,
        quantity,
        stored_coins,
        timestamp: now,
    });

    Ok(())
}
