use spacetimedb::ReducerContext;
use crate::tables::session_state::session_state;

#[spacetimedb::reducer]
pub fn sign_out(ctx: &ReducerContext) -> Result<(), String> {
    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender)
        .ok_or("active session not found".to_string())?;

    if session.identity != ctx.sender {
        log::warn!("unauthorized sign_out attempt: identity={}", ctx.sender);
        return Err("unauthorized".to_string());
    }

    ctx.db.session_state().identity().delete(ctx.sender);
    Ok(())
}
