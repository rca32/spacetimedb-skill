use spacetimedb::{Identity, ReducerContext};

use crate::tables::{balance_params_trait, moderation_flag_trait, role_binding_trait};

const MODERATION_BLOCK_THRESHOLD: i32 = 100;
const SERVER_IDENTITY_KEY: &str = "server.identity_hex";

#[repr(u8)]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum Role {
    Player = 0,
    Mod = 1,
    Gm = 2,
    Admin = 3,
}

pub fn ensure_not_blocked(ctx: &ReducerContext, identity: Identity) -> Result<(), String> {
    let Some(flag) = ctx.db.moderation_flag().identity().find(&identity) else {
        return Ok(());
    };

    if flag.score >= MODERATION_BLOCK_THRESHOLD {
        return Err("Account blocked by moderation flag".to_string());
    }

    Ok(())
}

pub fn require_role(ctx: &ReducerContext, required: Role) -> Result<(), String> {
    let identity = ctx.sender;
    let mut max_role = Role::Player as u8;

    for binding in ctx.db.role_binding().identity().filter(&identity) {
        if binding.role > max_role {
            max_role = binding.role;
        }
    }

    if max_role < required as u8 {
        return Err("Insufficient role".to_string());
    }

    Ok(())
}

pub fn ensure_server_identity(_ctx: &ReducerContext) -> Result<(), String> {
    let identity = _ctx.sender;
    if is_server_identity(_ctx, identity) {
        return Ok(());
    }

    require_role(_ctx, Role::Admin)
}

fn is_server_identity(ctx: &ReducerContext, identity: Identity) -> bool {
    let Some(param) = ctx
        .db
        .balance_params()
        .key()
        .find(&SERVER_IDENTITY_KEY.to_string())
    else {
        return false;
    };

    let value = param.value.trim();
    let value = value.strip_prefix("0x").unwrap_or(value);
    if let Ok(parsed) = Identity::from_hex(value) {
        return parsed == identity;
    }

    false
}
