use spacetimedb::ReducerContext;

use crate::auth::sign_in::create_session;

#[spacetimedb::reducer]
pub fn sign_in(ctx: &ReducerContext, region_id: u64) -> Result<(), String> {
    let identity = ctx.sender;
    let _session_id = create_session(ctx, identity, region_id)?;

    Ok(())
}
