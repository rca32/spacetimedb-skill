use spacetimedb::ReducerContext;

use crate::tables::player_state_trait;

pub mod auction_cancel_order;
pub mod auction_create_order;
pub mod auction_match;
pub mod barter_create_order;
pub mod barter_fill_order;
pub mod trade_accept;
pub mod trade_add_item;
pub mod trade_cancel;
pub mod trade_finalize;
pub mod trade_initiate_session;
pub mod trade_sessions_agent;

pub const TRADE_STATUS_OFFERED: u8 = 0;
pub const TRADE_STATUS_INITIATOR_OK: u8 = 1;
pub const TRADE_STATUS_ACCEPTOR_OK: u8 = 2;
pub const TRADE_STATUS_RESOLVED: u8 = 3;

pub fn get_sender_entity(ctx: &ReducerContext) -> Result<u64, String> {
    let identity = ctx.sender;
    let player = ctx
        .db
        .player_state()
        .identity()
        .filter(&identity)
        .next()
        .ok_or("Player not found".to_string())?;
    Ok(player.entity_id)
}
