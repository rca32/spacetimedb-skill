use spacetimedb::{Identity, ReducerContext};

use crate::tables::session_state_trait;

pub fn sign_out_session(
    ctx: &ReducerContext,
    session_id: u64,
    identity: Identity,
) -> Result<(), String> {
    let Some(session) = ctx.db.session_state().session_id().find(&session_id) else {
        return Err("Session not found".to_string());
    };

    if session.identity != identity {
        return Err("Unauthorized".to_string());
    }

    ctx.db.session_state().session_id().delete(&session_id);
    Ok(())
}

pub fn force_sign_out(ctx: &ReducerContext, session_id: u64) -> Result<(), String> {
    let Some(session) = ctx.db.session_state().session_id().find(&session_id) else {
        return Err("Session not found".to_string());
    };

    ctx.db
        .session_state()
        .session_id()
        .delete(&session.session_id);
    Ok(())
}
