use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::auth::{ensure_server_identity, require_role, Role};
use crate::tables::{role_binding_trait, RoleBinding};

#[spacetimedb::reducer]
pub fn role_binding_update(
    ctx: &ReducerContext,
    identity: Identity,
    role: u8,
) -> Result<(), String> {
    require_role(ctx, Role::Admin)?;
    ensure_server_identity(ctx)?;

    let granted_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    if let Some(existing) = ctx
        .db
        .role_binding()
        .identity()
        .filter(&identity)
        .find(|binding| binding.role == role)
    {
        ctx.db.role_binding().binding_id().update(RoleBinding {
            binding_id: existing.binding_id,
            identity,
            role,
            granted_at,
        });
    } else {
        ctx.db.role_binding().insert(RoleBinding {
            binding_id: ctx.random(),
            identity,
            role,
            granted_at,
        });
    }

    Ok(())
}
