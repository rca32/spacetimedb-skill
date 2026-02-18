use spacetimedb::{Identity, ReducerContext};

use super::helpers::{append_audit_log, is_supported_role, require_admin, role_binding_id};
use crate::tables::role_binding::role_binding;

#[spacetimedb::reducer]
pub fn role_revoke(
    ctx: &ReducerContext,
    target_identity: Identity,
    role: String,
) -> Result<(), String> {
    require_admin(ctx)?;

    let normalized = role.trim().to_ascii_lowercase();
    if !is_supported_role(&normalized) {
        return Err("unsupported role".to_string());
    }

    let binding_id = role_binding_id(target_identity, &normalized);
    if ctx
        .db
        .role_binding()
        .binding_id()
        .find(binding_id.clone())
        .is_some()
    {
        ctx.db.role_binding().binding_id().delete(binding_id);
    }

    append_audit_log(
        ctx,
        "role_revoke",
        format!(
            "{{\"target_identity\":\"{}\",\"role\":\"{}\"}}",
            target_identity, normalized
        ),
    );

    Ok(())
}
