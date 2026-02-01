use spacetimedb::ReducerContext;

use crate::reducers::trade::get_sender_entity;
use crate::tables::auction_order_trait;

#[spacetimedb::reducer]
pub fn auction_cancel_order(ctx: &ReducerContext, order_id: u64) -> Result<(), String> {
    let owner_entity_id = get_sender_entity(ctx)?;
    let order = ctx
        .db
        .auction_order()
        .order_id()
        .find(&order_id)
        .ok_or("Order not found".to_string())?;

    if order.owner_entity_id != owner_entity_id {
        return Err("Not order owner".to_string());
    }

    ctx.db.auction_order().order_id().delete(&order_id);

    Ok(())
}
