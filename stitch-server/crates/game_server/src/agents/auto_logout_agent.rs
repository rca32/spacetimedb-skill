use spacetimedb::{ReducerContext, Table};

use crate::auth::sign_out::force_sign_out;
use crate::tables::{balance_params_trait, session_state_trait};

const DEFAULT_IDLE_SECONDS: u64 = 900;

pub fn run_auto_logout(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let idle_seconds =
        get_param_u64(ctx, "session.auto_logout_idle_seconds").unwrap_or(DEFAULT_IDLE_SECONDS);
    let cutoff = now.saturating_sub(idle_seconds.saturating_mul(1_000_000));

    let mut logged_out = 0u32;
    for session in ctx.db.session_state().iter() {
        if session.last_active_at < cutoff {
            let _ = force_sign_out(ctx, session.session_id);
            logged_out += 1;
        }
    }

    logged_out
}

fn get_param_u64(ctx: &ReducerContext, key: &str) -> Option<u64> {
    ctx.db
        .balance_params()
        .key()
        .find(&key.to_string())
        .and_then(|param| param.value.parse().ok())
}
