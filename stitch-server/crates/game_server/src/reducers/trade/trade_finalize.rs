use spacetimedb::{ReducerContext, Table};

use crate::tables::{inventory_slot_trait, trade_session_trait, TradeSession};

pub fn unlock_items_for_session(
    ctx: &ReducerContext,
    session: &TradeSession,
) -> Result<(), String> {
    for pocket in session
        .initiator_offer
        .iter()
        .chain(session.acceptor_offer.iter())
    {
        if let Some(mut slot) = ctx
            .db
            .inventory_slot()
            .iter()
            .find(|slot| slot.item_instance_id == pocket.item_instance_id)
        {
            slot.locked = false;
            ctx.db.inventory_slot().slot_id().update(slot);
        }
    }

    Ok(())
}

pub fn trade_finalize_internal(ctx: &ReducerContext, session_id: u64) -> Result<(), String> {
    let session = ctx
        .db
        .trade_session()
        .session_id()
        .find(&session_id)
        .ok_or("Trade session not found".to_string())?;

    unlock_items_for_session(ctx, &session)?;

    ctx.db.trade_session().session_id().delete(&session_id);

    Ok(())
}

#[spacetimedb::reducer]
pub fn trade_finalize(ctx: &ReducerContext, session_id: u64) -> Result<(), String> {
    trade_finalize_internal(ctx, session_id)
}
