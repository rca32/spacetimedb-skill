use spacetimedb::{ReducerContext, Table};

use crate::tables::{balance_params_trait, session_state_trait};

const DEFAULT_EXPIRE_SECONDS: u64 = 86_400;

pub fn run_session_cleanup(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let expire_seconds =
        get_param_u64(ctx, "session.cleanup_expire_seconds").unwrap_or(DEFAULT_EXPIRE_SECONDS);
    let cutoff = now.saturating_sub(expire_seconds.saturating_mul(1_000_000));

    let mut deleted = 0u32;
    for session in ctx.db.session_state().iter() {
        if session.last_active_at < cutoff {
            ctx.db
                .session_state()
                .session_id()
                .delete(&session.session_id);
            deleted += 1;
        }
    }

    deleted
}

fn get_param_u64(ctx: &ReducerContext, key: &str) -> Option<u64> {
    ctx.db
        .balance_params()
        .key()
        .find(&key.to_string())
        .and_then(|param| param.value.parse().ok())
}
