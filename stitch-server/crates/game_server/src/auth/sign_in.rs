use spacetimedb::{ReducerContext, Table};

use crate::services::hex_coords::DEFAULT_WORLD_DIMENSION_ID;
use crate::services::projection_views;
use crate::tables::account::account;
use crate::tables::session_state::session_state;
use crate::tables::SessionState;

#[spacetimedb::reducer]
pub fn sign_in(ctx: &ReducerContext, region_id: u64) -> Result<(), String> {
    log::info!(
        "sign_in requested: identity={} region_id={}",
        ctx.sender,
        region_id
    );
    super::ensure_account_exists(ctx);

    let account = ctx
        .db
        .account()
        .identity()
        .find(ctx.sender)
        .ok_or("account not found".to_string())?;

    if account.status != 0 {
        log::warn!("blocked sign_in attempt: identity={}", ctx.sender);
        return Err("account blocked".to_string());
    }

    let next_state = SessionState {
        identity: ctx.sender,
        region_id,
        dimension_id: DEFAULT_WORLD_DIMENSION_ID,
        last_active_at: ctx.timestamp,
    };

    let had_session = ctx.db.session_state().identity().find(ctx.sender).is_some();
    if had_session {
        ctx.db.session_state().identity().update(next_state);
    } else {
        ctx.db.session_state().insert(next_state);
    }
    log::info!(
        "sign_in session_upsert: identity={} region_id={} mode={}",
        ctx.sender,
        region_id,
        if had_session { "update" } else { "insert" }
    );

    super::ensure_player_state_exists(ctx, "new-player".to_string());
    super::ensure_transform_exists(ctx, region_id, DEFAULT_WORLD_DIMENSION_ID);
    projection_views::sync_player_session_view(ctx, ctx.sender);
    log::info!(
        "sign_in session_view_synced: identity={} region_id={}",
        ctx.sender,
        region_id
    );
    projection_views::sync_player_wallet_view(ctx, ctx.sender);
    Ok(())
}
