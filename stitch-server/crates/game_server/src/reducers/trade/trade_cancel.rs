use spacetimedb::{ReducerContext, Table};

use crate::reducers::trade::get_sender_entity;
use crate::reducers::trade::trade_finalize::unlock_items_for_session;
use crate::tables::{escrow_item_trait, trade_session_trait};

#[spacetimedb::reducer]
pub fn trade_cancel(ctx: &ReducerContext, session_id: u64) -> Result<(), String> {
    let sender_id = get_sender_entity(ctx)?;
    let session = ctx
        .db
        .trade_session()
        .session_id()
        .find(&session_id)
        .ok_or("Trade session not found".to_string())?;

    if sender_id != session.initiator_id && sender_id != session.acceptor_id {
        return Err("Not a participant".to_string());
    }

    unlock_items_for_session(ctx, &session)?;

    for escrow in ctx
        .db
        .escrow_item()
        .iter()
        .filter(|e| e.session_id == session_id)
    {
        ctx.db.escrow_item().escrow_id().delete(&escrow.escrow_id);
    }

    ctx.db.trade_session().session_id().delete(&session_id);

    Ok(())
}
