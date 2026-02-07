use spacetimedb::{Identity, ReducerContext};

use crate::tables::permission_state::permission_state;

pub const PERM_BUILD: u32 = 0x0004;
pub const PERM_ADMIN: u32 = 0x0020;

pub fn permission_key(target_kind: u8, target_id: u64, subject: Identity) -> String {
    format!("{target_kind}:{target_id}:{subject}")
}

pub fn has_permission(ctx: &ReducerContext, target_kind: u8, target_id: u64, required: u32) -> bool {
    let key = permission_key(target_kind, target_id, ctx.sender);
    if let Some(row) = ctx.db.permission_state().permission_key().find(key) {
        return row.flags & required == required;
    }
    false
}
