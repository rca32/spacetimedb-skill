use spacetimedb::{ReducerContext, Table};

use crate::reducers::trade::get_sender_entity;
use crate::tables::{
    escrow_item_trait, inventory_slot_trait, item_instance_trait, item_stack_trait,
    trade_session_trait, EscrowItem, TradePocket,
};

#[spacetimedb::reducer]
pub fn trade_add_item(
    ctx: &ReducerContext,
    session_id: u64,
    item_instance_id: u64,
    quantity: i32,
) -> Result<(), String> {
    if quantity <= 0 {
        return Err("Quantity must be positive".to_string());
    }

    let sender_id = get_sender_entity(ctx)?;
    let mut session = ctx
        .db
        .trade_session()
        .session_id()
        .find(&session_id)
        .ok_or("Trade session not found".to_string())?;

    if sender_id != session.initiator_id && sender_id != session.acceptor_id {
        return Err("Not a participant".to_string());
    }

    let item_instance = ctx
        .db
        .item_instance()
        .item_instance_id()
        .find(&item_instance_id)
        .ok_or("Item instance not found".to_string())?;

    let stack = ctx
        .db
        .item_stack()
        .item_instance_id()
        .find(&item_instance_id)
        .ok_or("Item stack not found".to_string())?;

    if stack.quantity < quantity {
        return Err("Not enough quantity".to_string());
    }

    if let Some(mut slot) = ctx
        .db
        .inventory_slot()
        .iter()
        .find(|slot| slot.item_instance_id == item_instance_id)
    {
        if slot.locked {
            return Err("Slot locked".to_string());
        }
        slot.locked = true;
        ctx.db.inventory_slot().slot_id().update(slot);
    }

    let pocket = TradePocket {
        item_instance_id,
        quantity,
    };

    if sender_id == session.initiator_id {
        session.initiator_offer.push(pocket);
    } else {
        session.acceptor_offer.push(pocket);
    }

    session.updated_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    ctx.db.trade_session().session_id().update(session);

    ctx.db.escrow_item().insert(EscrowItem {
        escrow_id: session_id + item_instance_id,
        session_id,
        owner_entity_id: sender_id,
        item_def_id: item_instance.item_def_id,
        item_type: item_instance.item_type,
        quantity,
    });

    Ok(())
}
