use spacetimedb::{ReducerContext, Table};

use crate::reducers::trade::{get_sender_entity, TRADE_STATUS_OFFERED};
use crate::services::trade_guard;
use crate::tables::{trade_session_trait, TradeSession};

const TRADE_DISTANCE: f32 = 5.0;

#[spacetimedb::reducer]
pub fn trade_initiate_session(ctx: &ReducerContext, acceptor_id: u64) -> Result<(), String> {
    let initiator_id = get_sender_entity(ctx)?;

    if initiator_id == acceptor_id {
        return Err("Cannot trade with self".to_string());
    }

    trade_guard::ensure_distance(ctx, initiator_id, acceptor_id, TRADE_DISTANCE)?;
    trade_guard::ensure_not_in_combat(ctx, initiator_id)?;
    trade_guard::ensure_not_in_combat(ctx, acceptor_id)?;

    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let session_id = now + initiator_id + acceptor_id;

    ctx.db.trade_session().insert(TradeSession {
        session_id,
        initiator_id,
        acceptor_id,
        status: TRADE_STATUS_OFFERED,
        initiator_offer: Vec::new(),
        acceptor_offer: Vec::new(),
        updated_at: now,
    });

    Ok(())
}
