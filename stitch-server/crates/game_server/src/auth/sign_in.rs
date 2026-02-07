use spacetimedb::{ReducerContext, Table};

use crate::tables::SessionState;
use crate::tables::account::account;
use crate::tables::session_state::session_state;

#[spacetimedb::reducer]
pub fn sign_in(ctx: &ReducerContext, region_id: u64) -> Result<(), String> {
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
        last_active_at: ctx.timestamp,
    };

    if ctx.db.session_state().identity().find(ctx.sender).is_some() {
        ctx.db.session_state().identity().update(next_state);
    } else {
        ctx.db.session_state().insert(next_state);
    }

    super::ensure_player_state_exists(ctx, "new-player".to_string());
    super::ensure_transform_exists(ctx, region_id);
    Ok(())
}
