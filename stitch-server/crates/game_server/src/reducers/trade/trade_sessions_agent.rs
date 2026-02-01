use spacetimedb::{ReducerContext, Table};

use crate::reducers::trade::trade_finalize::unlock_items_for_session;
use crate::tables::{escrow_item_trait, trade_session_trait, TradeSession};

const TRADE_TIMEOUT_MICROS: u64 = 45_000_000;

#[spacetimedb::reducer]
pub fn trade_sessions_agent(ctx: &ReducerContext) -> Result<(), String> {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let stale_sessions: Vec<TradeSession> = ctx
        .db
        .trade_session()
        .iter()
        .filter(|s| now.saturating_sub(s.updated_at) > TRADE_TIMEOUT_MICROS)
        .collect();

    for session in stale_sessions {
        unlock_items_for_session(ctx, &session)?;
        for escrow in ctx
            .db
            .escrow_item()
            .iter()
            .filter(|e| e.session_id == session.session_id)
        {
            ctx.db.escrow_item().escrow_id().delete(&escrow.escrow_id);
        }
        ctx.db
            .trade_session()
            .session_id()
            .delete(&session.session_id);
    }

    Ok(())
}
