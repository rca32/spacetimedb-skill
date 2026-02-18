use spacetimedb::{Identity, ReducerContext, Table};

use super::helpers::{
    add_moderation_score, append_audit_log, clear_ban, ensure_ops_rate_limit, require_ops_role,
    set_ban,
};
use crate::tables::ops_moderation::moderation_action;
use crate::tables::ModerationAction;

#[spacetimedb::reducer]
pub fn moderation_apply_action(
    ctx: &ReducerContext,
    target_identity: Identity,
    action_type: String,
    reason: String,
    duration_minutes: i32,
) -> Result<(), String> {
    require_ops_role(ctx)?;
    let action = action_type.trim().to_ascii_lowercase();
    let reason = reason.trim().to_string();

    if action.is_empty() {
        return Err("action_type must not be empty".to_string());
    }
    if reason.is_empty() {
        return Err("reason must not be empty".to_string());
    }

    ensure_ops_rate_limit(ctx, "moderation_apply_action", &target_identity.to_string())?;

    match action.as_str() {
        "warn" => {
            add_moderation_score(ctx, target_identity, 1, reason.clone());
        }
        "ban" => {
            add_moderation_score(ctx, target_identity, 3, reason.clone());
            set_ban(
                ctx,
                target_identity,
                duration_minutes.max(60),
                reason.clone(),
            );
        }
        "unban" => {
            clear_ban(ctx, target_identity);
            add_moderation_score(ctx, target_identity, -1, reason.clone());
        }
        _ => return Err("unsupported action_type (warn|ban|unban)".to_string()),
    }

    ctx.db.moderation_action().insert(ModerationAction {
        action_id: 0,
        target_identity,
        action_type: action.clone(),
        reason: reason.clone(),
        actor_identity: ctx.sender,
        created_at: ctx.timestamp,
    });

    append_audit_log(
        ctx,
        "moderation_apply_action",
        format!(
            "{{\"target_identity\":\"{}\",\"action_type\":\"{}\",\"duration_minutes\":{}}}",
            target_identity, action, duration_minutes
        ),
    );

    Ok(())
}
