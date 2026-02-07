use spacetimedb::{ReducerContext, Table};

use crate::tables::MarketFill;
use crate::tables::trade_market::market_fill;
use crate::tables::trade_market::market_order;

#[spacetimedb::reducer]
pub fn market_order_match(
    ctx: &ReducerContext,
    buy_order_id: String,
    sell_order_id: String,
    quantity: u32,
) -> Result<(), String> {
    if quantity == 0 {
        return Err("quantity must be > 0".to_string());
    }

    let mut buy = ctx
        .db
        .market_order()
        .order_id()
        .find(buy_order_id.clone())
        .ok_or("buy order not found".to_string())?;
    let mut sell = ctx
        .db
        .market_order()
        .order_id()
        .find(sell_order_id.clone())
        .ok_or("sell order not found".to_string())?;

    if buy.status != 0 || sell.status != 0 {
        return Err("both orders must be open".to_string());
    }
    if buy.side != 0 || sell.side != 1 {
        return Err("order sides must be buy(0) and sell(1)".to_string());
    }
    if buy.item_def_id != sell.item_def_id {
        return Err("item_def mismatch".to_string());
    }
    if buy.region_id != sell.region_id {
        return Err("region mismatch".to_string());
    }
    if buy.unit_price < sell.unit_price {
        return Err("buy price is lower than sell price".to_string());
    }
    if buy.owner_identity == sell.owner_identity {
        return Err("self matching is not allowed".to_string());
    }

    let fill_qty = quantity.min(buy.quantity_open).min(sell.quantity_open);
    if fill_qty == 0 {
        return Err("no remaining quantity to match".to_string());
    }

    buy.quantity_open -= fill_qty;
    sell.quantity_open -= fill_qty;
    if buy.quantity_open == 0 {
        buy.status = 2;
    }
    if sell.quantity_open == 0 {
        sell.status = 2;
    }
    buy.updated_at = ctx.timestamp;
    sell.updated_at = ctx.timestamp;

    let buy_item_def_id = buy.item_def_id;
    let buyer_identity = buy.owner_identity;
    let seller_identity = sell.owner_identity;
    let fill_unit_price = sell.unit_price;
    ctx.db.market_order().order_id().update(buy);
    ctx.db.market_order().order_id().update(sell);

    let fill_id = format!("{}:{}:{}", buy_order_id, sell_order_id, ctx.timestamp);
    if ctx.db.market_fill().fill_id().find(fill_id.clone()).is_none() {
        ctx.db.market_fill().insert(MarketFill {
            fill_id,
            buy_order_id,
            sell_order_id,
            item_def_id: buy_item_def_id,
            quantity: fill_qty,
            unit_price: fill_unit_price,
            buyer_identity,
            seller_identity,
            created_at: ctx.timestamp,
        });
    }

    Ok(())
}
