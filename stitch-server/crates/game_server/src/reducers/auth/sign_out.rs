use spacetimedb::ReducerContext;

use crate::auth::sign_out::sign_out_session;

#[spacetimedb::reducer]
pub fn sign_out(ctx: &ReducerContext, session_id: u64) -> Result<(), String> {
    sign_out_session(ctx, session_id, ctx.sender)
}
