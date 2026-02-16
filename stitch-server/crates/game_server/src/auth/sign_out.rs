use crate::services::projection_views;
use crate::tables::session_state::session_state;
use spacetimedb::ReducerContext;

#[spacetimedb::reducer]
pub fn sign_out(ctx: &ReducerContext) -> Result<(), String> {
    log::info!("sign_out requested: identity={}", ctx.sender);
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
    let region_id = session.region_id;

    ctx.db.session_state().identity().delete(ctx.sender);
    projection_views::sync_player_session_view(ctx, ctx.sender);
    log::info!(
        "sign_out session_deleted: identity={} region_id={}",
        ctx.sender,
        region_id
    );
    Ok(())
}
