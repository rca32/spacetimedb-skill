use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::auth::{ensure_server_identity, require_role, Role};
use crate::tables::{moderation_flag_trait, ModerationFlag};

#[spacetimedb::reducer]
pub fn moderation_flag_update(
    ctx: &ReducerContext,
    identity: Identity,
    score: i32,
    reason: String,
) -> Result<(), String> {
    require_role(ctx, Role::Mod)?;
    ensure_server_identity(ctx)?;

    if let Some(existing) = ctx.db.moderation_flag().identity().find(&identity) {
        ctx.db.moderation_flag().identity().update(ModerationFlag {
            score,
            last_reason: reason,
            ..existing
        });
    } else {
        ctx.db.moderation_flag().insert(ModerationFlag {
            identity,
            score,
            last_reason: reason,
        });
    }

    Ok(())
}
