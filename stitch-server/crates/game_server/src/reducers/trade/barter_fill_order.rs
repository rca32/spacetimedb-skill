use spacetimedb::ReducerContext;

use crate::reducers::trade::get_sender_entity;
use crate::services::trade_guard;
use crate::tables::barter_order_trait;

const BARTER_DISTANCE: f32 = 5.0;

#[spacetimedb::reducer]
pub fn barter_fill_order(ctx: &ReducerContext, order_id: u64, quantity: i32) -> Result<(), String> {
    if quantity <= 0 {
        return Err("Quantity must be positive".to_string());
    }

    let buyer_id = get_sender_entity(ctx)?;
    let mut order = ctx
        .db
        .barter_order()
        .order_id()
        .find(&order_id)
        .ok_or("Order not found".to_string())?;

    trade_guard::ensure_distance(ctx, buyer_id, order.shop_entity_id, BARTER_DISTANCE)?;

    if order.remaining_stock < quantity {
        return Err("Not enough stock".to_string());
    }

    order.remaining_stock -= quantity;
    if order.remaining_stock <= 0 {
        ctx.db.barter_order().order_id().delete(&order_id);
    } else {
        ctx.db.barter_order().order_id().update(order);
    }

    Ok(())
}
