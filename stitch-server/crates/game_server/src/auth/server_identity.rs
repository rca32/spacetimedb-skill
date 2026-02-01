use spacetimedb::ReducerContext;

use crate::services::auth::{ensure_server_identity, require_role, Role};

pub struct ServerIdentity;

impl ServerIdentity {
    pub fn validate_server_or_admin(ctx: &ReducerContext) -> Result<(), String> {
        if ensure_server_identity(ctx).is_ok() {
            return Ok(());
        }

        if require_role(ctx, Role::Admin).is_ok() {
            return Ok(());
        }

        Err("Unauthorized".to_string())
    }
}
