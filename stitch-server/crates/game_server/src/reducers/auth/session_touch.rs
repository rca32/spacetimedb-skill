use spacetimedb::ReducerContext;

use crate::services::auth::ensure_server_identity;
use crate::tables::{session_state_trait, SessionState};

#[spacetimedb::reducer]
pub fn session_touch(ctx: &ReducerContext, session_id: u64) -> Result<(), String> {
    ensure_server_identity(ctx)?;

    let Some(session) = ctx.db.session_state().session_id().find(&session_id) else {
        return Err("Session not found".to_string());
    };

    ctx.db.session_state().session_id().update(SessionState {
        last_active_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
        ..session
    });

    Ok(())
}
