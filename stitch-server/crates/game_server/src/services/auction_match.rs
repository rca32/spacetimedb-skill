use spacetimedb::{ReducerContext, Table};

use crate::tables::{auction_order_trait, order_fill_trait, AuctionOrder, OrderFill};

pub fn match_orders(
    ctx: &ReducerContext,
    item_def_id: u64,
    claim_entity_id: u64,
) -> Result<u32, String> {
    let mut buy_orders: Vec<AuctionOrder> = ctx
        .db
        .auction_order()
        .iter()
        .filter(|o| {
            o.item_def_id == item_def_id
                && o.claim_entity_id == claim_entity_id
                && o.order_type == 0
        })
        .collect();

    let mut sell_orders: Vec<AuctionOrder> = ctx
        .db
        .auction_order()
        .iter()
        .filter(|o| {
            o.item_def_id == item_def_id
                && o.claim_entity_id == claim_entity_id
                && o.order_type == 1
        })
        .collect();

    buy_orders.sort_by(|a, b| b.price_threshold.cmp(&a.price_threshold));
    sell_orders.sort_by(|a, b| a.price_threshold.cmp(&b.price_threshold));

    let mut fills = 0u32;
    for buy in buy_orders {
        let mut remaining_buy = buy.quantity;
        for sell in sell_orders.iter_mut() {
            if remaining_buy <= 0 || sell.quantity <= 0 {
                continue;
            }
            if sell.price_threshold > buy.price_threshold {
                continue;
            }

            let fill_qty = remaining_buy.min(sell.quantity);
            remaining_buy -= fill_qty;
            sell.quantity -= fill_qty;

            let fill = OrderFill {
                fill_id: ctx.timestamp.to_micros_since_unix_epoch() as u64 + fills as u64,
                order_id: buy.order_id,
                owner_entity_id: buy.owner_entity_id,
                item_def_id,
                item_type: buy.item_type,
                quantity: fill_qty,
                coins: fill_qty * sell.price_threshold,
                timestamp: ctx.timestamp.to_micros_since_unix_epoch() as u64,
            };
            ctx.db.order_fill().insert(fill);
            fills += 1;
        }

        let mut updated_buy = buy;
        updated_buy.quantity = remaining_buy;
        if updated_buy.quantity <= 0 {
            ctx.db
                .auction_order()
                .order_id()
                .delete(&updated_buy.order_id);
        } else {
            ctx.db.auction_order().order_id().update(updated_buy);
        }
    }

    for sell in sell_orders {
        if sell.quantity <= 0 {
            ctx.db.auction_order().order_id().delete(&sell.order_id);
        } else {
            ctx.db.auction_order().order_id().update(sell);
        }
    }

    Ok(fills)
}
