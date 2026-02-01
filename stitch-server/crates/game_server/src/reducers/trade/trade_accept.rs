use spacetimedb::ReducerContext;

use crate::reducers::trade::{
    get_sender_entity, trade_finalize::trade_finalize_internal, TRADE_STATUS_ACCEPTOR_OK,
    TRADE_STATUS_INITIATOR_OK, TRADE_STATUS_RESOLVED,
};
use crate::tables::trade_session_trait;

#[spacetimedb::reducer]
pub fn trade_accept(ctx: &ReducerContext, session_id: u64) -> Result<(), String> {
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

    if session.status == TRADE_STATUS_RESOLVED {
        return Err("Trade already resolved".to_string());
    }

    if sender_id == session.initiator_id {
        session.status = if session.status == TRADE_STATUS_ACCEPTOR_OK {
            TRADE_STATUS_RESOLVED
        } else {
            TRADE_STATUS_INITIATOR_OK
        };
    } else {
        session.status = if session.status == TRADE_STATUS_INITIATOR_OK {
            TRADE_STATUS_RESOLVED
        } else {
            TRADE_STATUS_ACCEPTOR_OK
        };
    }

    session.updated_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let resolved = session.status == TRADE_STATUS_RESOLVED;
    ctx.db.trade_session().session_id().update(session);

    if resolved {
        trade_finalize_internal(ctx, session_id)?;
    }

    Ok(())
}
