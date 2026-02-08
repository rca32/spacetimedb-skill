use crate::services::projection_views;
use crate::tables::session_state::session_state;
use spacetimedb::ReducerContext;

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
    projection_views::sync_player_session_view(ctx, ctx.sender);
    Ok(())
}
