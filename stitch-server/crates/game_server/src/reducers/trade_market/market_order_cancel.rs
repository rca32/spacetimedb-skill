use spacetimedb::ReducerContext;

use crate::tables::trade_market::market_order;

#[spacetimedb::reducer]
pub fn market_order_cancel(ctx: &ReducerContext, order_id: String) -> Result<(), String> {
    let mut order = ctx
        .db
        .market_order()
        .order_id()
        .find(order_id)
        .ok_or("order not found".to_string())?;

    if order.owner_identity != ctx.sender {
        return Err("only owner can cancel order".to_string());
    }
    if order.status != 0 {
        return Err("order is not open".to_string());
    }

    order.status = 1;
    order.updated_at = ctx.timestamp;
    ctx.db.market_order().order_id().update(order);

    Ok(())
}
