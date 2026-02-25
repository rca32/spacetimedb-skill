use spacetimedb::{ReducerContext, Table};

use crate::services::hex_coords::DEFAULT_WORLD_DIMENSION_ID;
use crate::tables::session_state::session_state;
use crate::tables::trade_market::trade_offer;
use crate::tables::trade_market::trade_session;

#[spacetimedb::reducer]
pub fn trade_accept(
    ctx: &ReducerContext,
    session_id: String,
    accepted: bool,
) -> Result<(), String> {
    let mut session = ctx
        .db
        .trade_session()
        .session_id()
        .find(session_id.clone())
        .ok_or("trade session not found".to_string())?;

    if session.phase != 0 && session.phase != 1 {
        return Err("trade session is not active".to_string());
    }

    if session.initiator_identity == ctx.sender() {
        session.initiator_accepted = accepted;
    } else if session.partner_identity == ctx.sender() {
        session.partner_accepted = accepted;
    } else {
        return Err("only session participants can accept".to_string());
    }
    let initiator_session = ctx
        .db
        .session_state()
        .identity()
        .find(session.initiator_identity)
        .ok_or("initiator session missing".to_string())?;
    let partner_session = ctx
        .db
        .session_state()
        .identity()
        .find(session.partner_identity)
        .ok_or("partner session missing".to_string())?;
    let initiator_dimension = if initiator_session.dimension_id == 0 {
        DEFAULT_WORLD_DIMENSION_ID
    } else {
        initiator_session.dimension_id
    };
    let partner_dimension = if partner_session.dimension_id == 0 {
        DEFAULT_WORLD_DIMENSION_ID
    } else {
        partner_session.dimension_id
    };
    if initiator_session.region_id != partner_session.region_id {
        return Err("trade participants are in different regions".to_string());
    }
    if initiator_dimension != partner_dimension {
        return Err("trade participants are in different dimensions".to_string());
    }
    session.region_id = initiator_session.region_id;
    if session.dimension_id == 0 {
        session.dimension_id = initiator_dimension;
    } else if session.dimension_id != initiator_dimension {
        return Err("trade session dimension mismatch".to_string());
    }

    let has_offer_from_initiator = ctx
        .db
        .trade_offer()
        .iter()
        .any(|x| x.session_id == session_id && x.owner_identity == session.initiator_identity);
    let has_offer_from_partner = ctx
        .db
        .trade_offer()
        .iter()
        .any(|x| x.session_id == session_id && x.owner_identity == session.partner_identity);

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
