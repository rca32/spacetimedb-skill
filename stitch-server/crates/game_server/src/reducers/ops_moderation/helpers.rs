use spacetimedb::{Identity, ReducerContext, Table, TimeDuration};

use crate::tables::ops_moderation::{audit_log, ban_list, moderation_flag, rate_limit_bucket};
use crate::tables::role_binding::role_binding;
use crate::tables::{AuditLog, BanList, ModerationFlag, RateLimitBucket};

pub const ROLE_MOD: &str = "mod";
pub const ROLE_GM: &str = "gm";
pub const ROLE_ADMIN: &str = "admin";

const OPS_RATE_WINDOW_SECONDS: i64 = 60;
const OPS_RATE_MAX_REQUESTS: u32 = 20;

pub fn role_binding_id(identity: Identity, role: &str) -> String {
    format!("{}:{}", identity, role)
}

pub fn has_role(ctx: &ReducerContext, identity: Identity, role: &str) -> bool {
    let key = role_binding_id(identity, role);
    ctx.db.role_binding().binding_id().find(key).is_some()
}

pub fn require_admin(ctx: &ReducerContext) -> Result<(), String> {
    if !has_role(ctx, ctx.sender(), ROLE_ADMIN) {
        return Err("admin role required".to_string());
    }
    Ok(())
}

pub fn require_ops_role(ctx: &ReducerContext) -> Result<(), String> {
    if has_role(ctx, ctx.sender(), ROLE_ADMIN)
        || has_role(ctx, ctx.sender(), ROLE_GM)
        || has_role(ctx, ctx.sender(), ROLE_MOD)
    {
        return Ok(());
    }
    Err("operator role required (mod/gm/admin)".to_string())
}

pub fn ensure_ops_rate_limit(
    ctx: &ReducerContext,
    action_type: &str,
    scope_id: &str,
) -> Result<(), String> {
    let key = format!("ops:{}:{}:{}", action_type, ctx.sender(), scope_id);
    if let Some(mut bucket) = ctx.db.rate_limit_bucket().bucket_key().find(key.clone()) {
        let elapsed = ctx
            .timestamp
            .to_micros_since_unix_epoch()
            .saturating_sub(bucket.window_started_at.to_micros_since_unix_epoch());

        if elapsed > OPS_RATE_WINDOW_SECONDS * 1_000_000 {
            bucket.count_in_window = 1;
            bucket.window_started_at = ctx.timestamp;
            ctx.db.rate_limit_bucket().bucket_key().update(bucket);
            return Ok(());
        }

        if bucket.count_in_window >= OPS_RATE_MAX_REQUESTS {
            return Err("ops action rate limit exceeded".to_string());
        }

        bucket.count_in_window += 1;
        ctx.db.rate_limit_bucket().bucket_key().update(bucket);
        return Ok(());
    }

    ctx.db.rate_limit_bucket().insert(RateLimitBucket {
        bucket_key: key,
        identity: ctx.sender(),
        action_type: action_type.to_string(),
        count_in_window: 1,
        window_started_at: ctx.timestamp,
    });

    Ok(())
}

pub fn append_audit_log(ctx: &ReducerContext, action_type: &str, payload: String) {
    ctx.db.audit_log().insert(AuditLog {
        audit_id: 0,
        actor_identity: ctx.sender(),
        action_type: action_type.to_string(),
        payload,
        created_at: ctx.timestamp,
    });
}

pub fn add_moderation_score(
    ctx: &ReducerContext,
    target_identity: Identity,
    delta: i32,
    reason: String,
) {
    let mut flag = ctx
        .db
        .moderation_flag()
        .identity()
        .find(target_identity)
        .unwrap_or(ModerationFlag {
            identity: target_identity,
            score: 0,
            last_reason: reason.clone(),
            updated_at: ctx.timestamp,
        });

    flag.score = (flag.score + delta).max(0);
    flag.last_reason = reason;
    flag.updated_at = ctx.timestamp;

    if ctx
        .db
        .moderation_flag()
        .identity()
        .find(target_identity)
        .is_some()
    {
        ctx.db.moderation_flag().identity().update(flag);
    } else {
        ctx.db.moderation_flag().insert(flag);
    }
}

pub fn set_ban(
    ctx: &ReducerContext,
    target_identity: Identity,
    duration_minutes: i32,
    reason: String,
) {
    let minutes = duration_minutes.max(1) as u64;
    let until_at = ctx.timestamp + TimeDuration::from_micros((minutes * 60 * 1_000_000) as i64);
    let next = BanList {
        identity: target_identity,
        until_at,
        reason,
        updated_at: ctx.timestamp,
    };

    if ctx.db.ban_list().identity().find(target_identity).is_some() {
        ctx.db.ban_list().identity().update(next);
    } else {
        ctx.db.ban_list().insert(next);
    }
}

pub fn clear_ban(ctx: &ReducerContext, target_identity: Identity) {
    if ctx.db.ban_list().identity().find(target_identity).is_some() {
        ctx.db.ban_list().identity().delete(target_identity);
    }
}

pub fn is_supported_role(role: &str) -> bool {
    role == ROLE_MOD || role == ROLE_GM || role == ROLE_ADMIN
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_supported_role() {
        assert!(is_supported_role(ROLE_MOD));
        assert!(is_supported_role(ROLE_GM));
        assert!(is_supported_role(ROLE_ADMIN));
        assert!(!is_supported_role("player"));
    }

    #[test]
    fn test_role_binding_id_format() {
        let id = Identity::ZERO;
        assert_eq!(role_binding_id(id, ROLE_MOD), format!("{}:mod", id));
    }
}
