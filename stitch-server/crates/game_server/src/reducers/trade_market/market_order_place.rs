use spacetimedb::{ReducerContext, Table};

use crate::tables::MarketOrder;
use crate::tables::item_def::item_def;
use crate::tables::session_state::session_state;
use crate::tables::trade_market::market_order;

#[spacetimedb::reducer]
pub fn market_order_place(
    ctx: &ReducerContext,
    order_id: String,
    side: u8,
    item_def_id: u64,
    quantity: u32,
    unit_price: u64,
) -> Result<(), String> {
    let oid = order_id.trim().to_string();
    if oid.is_empty() {
        return Err("order_id must not be empty".to_string());
    }
    if side > 1 {
        return Err("side must be 0(buy) or 1(sell)".to_string());
    }
    if quantity == 0 || unit_price == 0 {
        return Err("quantity and unit_price must be > 0".to_string());
    }
    if ctx.db.market_order().order_id().find(oid.clone()).is_some() {
        return Err("duplicate order_id".to_string());
    }

    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender)
        .ok_or("active session required".to_string())?;

    if ctx.db.item_def().item_def_id().find(item_def_id).is_none() {
        return Err("item_def not found".to_string());
    }

    ctx.db.market_order().insert(MarketOrder {
        order_id: oid,
        owner_identity: ctx.sender,
        region_id: session.region_id,
        side,
        item_def_id,
        quantity_open: quantity,
        unit_price,
        status: 0,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    Ok(())
}
