use spacetimedb::ReducerContext;

use crate::services::auth::{require_role, Role};

pub fn require_admin(ctx: &ReducerContext) -> Result<(), String> {
    require_role(ctx, Role::Admin)
}

pub fn require_gm(ctx: &ReducerContext) -> Result<(), String> {
    require_role(ctx, Role::Gm)
}

pub fn require_mod(ctx: &ReducerContext) -> Result<(), String> {
    require_role(ctx, Role::Mod)
}
