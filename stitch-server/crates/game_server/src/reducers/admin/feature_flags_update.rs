use spacetimedb::{ReducerContext, Table};

use crate::services::auth::{ensure_server_identity, require_role, Role};
use crate::tables::{feature_flags_trait, FeatureFlags};

#[spacetimedb::reducer]
pub fn feature_flags_update(
    ctx: &ReducerContext,
    agents_enabled: bool,
    player_regen_enabled: bool,
    auto_logout_enabled: bool,
    resource_regen_enabled: bool,
    building_decay_enabled: bool,
    npc_ai_enabled: bool,
    day_night_enabled: bool,
    environment_debuff_enabled: bool,
    chat_cleanup_enabled: bool,
    session_cleanup_enabled: bool,
    metric_snapshot_enabled: bool,
) -> Result<(), String> {
    require_role(ctx, Role::Admin)?;
    ensure_server_identity(ctx)?;

    let flags = FeatureFlags {
        id: 0,
        agents_enabled,
        player_regen_enabled,
        auto_logout_enabled,
        resource_regen_enabled,
        building_decay_enabled,
        npc_ai_enabled,
        day_night_enabled,
        environment_debuff_enabled,
        chat_cleanup_enabled,
        session_cleanup_enabled,
        metric_snapshot_enabled,
    };

    if ctx.db.feature_flags().id().find(&0).is_some() {
        ctx.db.feature_flags().id().update(flags);
    } else {
        ctx.db.feature_flags().insert(flags);
    }

    Ok(())
}
