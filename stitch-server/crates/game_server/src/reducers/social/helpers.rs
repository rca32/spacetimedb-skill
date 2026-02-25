use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::ops_moderation::rate_limit_bucket;
use crate::tables::social::social_feed;
use crate::tables::{RateLimitBucket, SocialFeed};

pub const PARTY_ROLE_MEMBER: u8 = 1;
pub const PARTY_ROLE_LEADER: u8 = 2;

pub const GUILD_ROLE_MEMBER: u8 = 1;
pub const GUILD_ROLE_OFFICER: u8 = 2;
pub const GUILD_ROLE_LEADER: u8 = 3;

const CHAT_RATE_WINDOW_SECONDS: i64 = 10;
const CHAT_RATE_MAX_MESSAGES: u32 = 5;

pub fn party_member_key(party_id: &str, member_identity: Identity) -> String {
    format!("{}:{}", party_id, member_identity)
}

pub fn guild_member_key(guild_id: &str, member_identity: Identity) -> String {
    format!("{}:{}", guild_id, member_identity)
}

pub fn has_rate_limit_capacity(
    ctx: &ReducerContext,
    action_type: &str,
    scope_id: &str,
) -> Result<(), String> {
    let key = format!("{}:{}:{}", action_type, ctx.sender(), scope_id);
    if let Some(mut bucket) = ctx.db.rate_limit_bucket().bucket_key().find(key.clone()) {
        let elapsed = ctx
            .timestamp
            .to_micros_since_unix_epoch()
            .saturating_sub(bucket.window_started_at.to_micros_since_unix_epoch());

        if elapsed > CHAT_RATE_WINDOW_SECONDS * 1_000_000 {
            bucket.count_in_window = 1;
            bucket.window_started_at = ctx.timestamp;
            ctx.db.rate_limit_bucket().bucket_key().update(bucket);
            return Ok(());
        }

        if bucket.count_in_window >= CHAT_RATE_MAX_MESSAGES {
            return Err("chat rate limit exceeded".to_string());
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

pub fn append_social_feed(
    ctx: &ReducerContext,
    identity: Identity,
    feed_type: &str,
    payload: String,
) {
    ctx.db.social_feed().insert(SocialFeed {
        feed_id: 0,
        identity_hex: identity.to_string(),
        feed_type: feed_type.to_string(),
        payload,
        created_at: ctx.timestamp,
    });
}
