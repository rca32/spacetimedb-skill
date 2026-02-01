use spacetimedb::{ReducerContext, Table};

use crate::reducers::trade::get_sender_entity;
use crate::services::trade_guard;
use crate::tables::{barter_order_trait, BarterOrder, InputItemStack};

const BARTER_DISTANCE: f32 = 5.0;

#[spacetimedb::reducer]
pub fn barter_create_order(
    ctx: &ReducerContext,
    shop_entity_id: u64,
    remaining_stock: i32,
    offer_items: Vec<InputItemStack>,
    required_items: Vec<InputItemStack>,
) -> Result<(), String> {
    if remaining_stock <= 0 {
        return Err("Stock must be positive".to_string());
    }

    let owner_entity_id = get_sender_entity(ctx)?;
    trade_guard::ensure_distance(ctx, owner_entity_id, shop_entity_id, BARTER_DISTANCE)?;

    let order_id = ctx.timestamp.to_micros_since_unix_epoch() as u64 + shop_entity_id;
    ctx.db.barter_order().insert(BarterOrder {
        order_id,
        shop_entity_id,
        remaining_stock,
        offer_items,
        required_items,
    });

    Ok(())
}
