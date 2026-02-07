use spacetimedb::{Identity, ReducerContext, Table};

use crate::reducers::inventory::inventory_lock::ensure_not_locked;
use crate::tables::TradeOffer;
use crate::tables::inventory_container::inventory_container;
use crate::tables::inventory_slot::inventory_slot;
use crate::tables::item_stack::item_stack;
use crate::tables::trade_market::trade_offer;
use crate::tables::trade_market::trade_session;

#[spacetimedb::reducer]
pub fn trade_item_add(
    ctx: &ReducerContext,
    session_id: String,
    item_instance_id: u64,
    quantity: u32,
) -> Result<(), String> {
    if quantity == 0 {
        return Err("quantity must be > 0".to_string());
    }

    let mut session = ctx
        .db
        .trade_session()
        .session_id()
        .find(session_id.clone())
        .ok_or("trade session not found".to_string())?;

    let is_initiator = session.initiator_identity == ctx.sender;
    let is_partner = session.partner_identity == ctx.sender;
    if !is_initiator && !is_partner {
        return Err("only session participants can add offer items".to_string());
    }
    if session.phase != 0 {
        return Err("trade session is not open".to_string());
    }

    let owner_container = main_container_id(ctx, ctx.sender)
        .ok_or("main inventory container not found".to_string())?;
    ensure_not_locked(ctx, owner_container)?;

    ensure_item_owned_in_container(ctx, owner_container, item_instance_id, quantity)?;

    let offer_key = format!("{}:{}:{}", session_id, ctx.sender, item_instance_id);
    if let Some(mut offer) = ctx.db.trade_offer().offer_key().find(offer_key.clone()) {
        offer.quantity = quantity;
        offer.updated_at = ctx.timestamp;
        ctx.db.trade_offer().offer_key().update(offer);
    } else {
        ctx.db.trade_offer().insert(TradeOffer {
            offer_key,
            session_id,
            owner_identity: ctx.sender,
            item_instance_id,
            quantity,
            created_at: ctx.timestamp,
            updated_at: ctx.timestamp,
        });
    }

    session.initiator_accepted = false;
    session.partner_accepted = false;
    session.updated_at = ctx.timestamp;
    ctx.db.trade_session().session_id().update(session);

    Ok(())
}

fn main_container_id(ctx: &ReducerContext, owner: Identity) -> Option<u64> {
    ctx.db
        .inventory_container()
        .iter()
        .find(|c| c.owner_identity == owner && c.inventory_index == 0)
        .map(|c| c.container_id)
}

fn ensure_item_owned_in_container(
    ctx: &ReducerContext,
    container_id: u64,
    item_instance_id: u64,
    quantity: u32,
) -> Result<(), String> {
    let owns_slot = ctx
        .db
        .inventory_slot()
        .iter()
        .any(|slot| slot.container_id == container_id && slot.item_instance_id == item_instance_id);

    if !owns_slot {
        return Err("item does not belong to caller main inventory".to_string());
    }

    let stack = ctx
        .db
        .item_stack()
        .item_instance_id()
        .find(item_instance_id)
        .ok_or("item stack missing".to_string())?;

    if stack.quantity < quantity {
        return Err("insufficient stack quantity".to_string());
    }

    Ok(())
}
