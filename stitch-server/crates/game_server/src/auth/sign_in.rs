use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::auth::ensure_not_blocked;
use crate::tables::{account_trait, session_state_trait, SessionState};

pub fn create_session(
    ctx: &ReducerContext,
    identity: Identity,
    region_id: u64,
) -> Result<u64, String> {
    ensure_not_blocked(ctx, identity)?;

    if ctx.db.account().identity().find(&identity).is_none() {
        return Err("Account not found".to_string());
    }

    if ctx
        .db
        .session_state()
        .identity()
        .filter(&identity)
        .next()
        .is_some()
    {
        return Err("Session already active".to_string());
    }

    let session_id = ctx.random();
    ctx.db.session_state().insert(SessionState {
        session_id,
        identity,
        region_id,
        last_active_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
    });

    Ok(session_id)
}
