use spacetimedb::{ReducerContext, Table};

use crate::tables::{balance_params_trait, chat_message_trait};

const DEFAULT_RETENTION_HOURS: u64 = 48;

pub fn run_chat_cleanup(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let retention_hours =
        get_param_u64(ctx, "chat.retention_hours").unwrap_or(DEFAULT_RETENTION_HOURS);
    let cutoff = now.saturating_sub(retention_hours.saturating_mul(3_600_000_000));

    let mut deleted = 0u32;
    for message in ctx.db.chat_message().iter() {
        if message.ts < cutoff {
            ctx.db
                .chat_message()
                .message_id()
                .delete(&message.message_id);
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
