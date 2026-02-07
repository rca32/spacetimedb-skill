use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::TradeSession;
use crate::tables::session_state::session_state;
use crate::tables::trade_market::trade_session;
use crate::tables::transform_state::transform_state;

const TRADE_RANGE_SQ: f32 = 100.0;

#[spacetimedb::reducer]
pub fn trade_session_open(
    ctx: &ReducerContext,
    session_id: String,
    partner_identity: Identity,
) -> Result<(), String> {
    let sid = session_id.trim().to_string();
    if sid.is_empty() {
        return Err("session_id must not be empty".to_string());
    }
    if ctx.sender == partner_identity {
        return Err("cannot open trade with self".to_string());
    }

    if ctx.db.trade_session().session_id().find(sid.clone()).is_some() {
        return Err("session_id already exists".to_string());
    }

    let my_session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender)
        .ok_or("active initiator session required".to_string())?;
    let partner_session = ctx
        .db
        .session_state()
        .identity()
        .find(partner_identity)
        .ok_or("active partner session required".to_string())?;

    if my_session.region_id != partner_session.region_id {
        return Err("partner is in different region".to_string());
    }

    let my_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender)
        .ok_or("initiator transform missing".to_string())?;
    let partner_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(partner_identity)
        .ok_or("partner transform missing".to_string())?;

    let dx = my_tf.position[0] - partner_tf.position[0];
    let dz = my_tf.position[2] - partner_tf.position[2];
    if dx * dx + dz * dz > TRADE_RANGE_SQ {
        return Err("partner is out of trade range".to_string());
    }

    ctx.db.trade_session().insert(TradeSession {
        session_id: sid,
        initiator_identity: ctx.sender,
        partner_identity,
        region_id: my_session.region_id,
        phase: 0,
        initiator_accepted: false,
        partner_accepted: false,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    Ok(())
}
