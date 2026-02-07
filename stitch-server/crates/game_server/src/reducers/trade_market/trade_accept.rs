use spacetimedb::{ReducerContext, Table};

use crate::tables::trade_market::trade_offer;
use crate::tables::trade_market::trade_session;

#[spacetimedb::reducer]
pub fn trade_accept(ctx: &ReducerContext, session_id: String, accepted: bool) -> Result<(), String> {
    let mut session = ctx
        .db
        .trade_session()
        .session_id()
        .find(session_id.clone())
        .ok_or("trade session not found".to_string())?;

    if session.phase != 0 && session.phase != 1 {
        return Err("trade session is not active".to_string());
    }

    if session.initiator_identity == ctx.sender {
        session.initiator_accepted = accepted;
    } else if session.partner_identity == ctx.sender {
        session.partner_accepted = accepted;
    } else {
        return Err("only session participants can accept".to_string());
    }

    let has_offer_from_initiator = ctx.db.trade_offer().iter().any(|x| {
        x.session_id == session_id && x.owner_identity == session.initiator_identity
    });
    let has_offer_from_partner = ctx.db.trade_offer().iter().any(|x| {
        x.session_id == session_id && x.owner_identity == session.partner_identity
    });

    if session.initiator_accepted && session.partner_accepted {
        if !has_offer_from_initiator && !has_offer_from_partner {
            return Err("cannot finalize empty trade".to_string());
        }
        session.phase = 2;
    } else {
        session.phase = 1;
    }

    session.updated_at = ctx.timestamp;
    ctx.db.trade_session().session_id().update(session);

    Ok(())
}
