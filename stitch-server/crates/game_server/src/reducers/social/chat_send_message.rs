use spacetimedb::{ReducerContext, Table};

use super::helpers::append_social_feed;
use super::helpers::has_rate_limit_capacity;
use crate::tables::session_state::session_state;
use crate::tables::social::{chat_channel, chat_message, guild_member, party_member};
use crate::tables::{ChatMessage, SessionState};

const CHANNEL_TYPE_GENERAL: u8 = 0;
const CHANNEL_TYPE_REGION: u8 = 1;
const CHANNEL_TYPE_PARTY: u8 = 2;
const CHANNEL_TYPE_GUILD: u8 = 3;

#[spacetimedb::reducer]
pub fn chat_send_message(
    ctx: &ReducerContext,
    channel_id: String,
    body: String,
) -> Result<(), String> {
    let cid = channel_id.trim().to_string();
    let message_body = body.trim().to_string();
    if cid.is_empty() {
        return Err("channel_id must not be empty".to_string());
    }
    if message_body.is_empty() {
        return Err("body must not be empty".to_string());
    }

    let channel = ctx
        .db
        .chat_channel()
        .channel_id()
        .find(cid.clone())
        .ok_or("chat channel not found".to_string())?;

    validate_channel_access(ctx, channel.channel_type, &channel.scope_id)?;

    has_rate_limit_capacity(ctx, "chat_send", &cid)?;

    let message_id = format!("{}:{}:{}", cid, ctx.sender, ctx.timestamp.to_micros_since_unix_epoch());
    ctx.db.chat_message().insert(ChatMessage {
        message_id,
        channel_id: cid.clone(),
        sender_identity: ctx.sender,
        body: message_body.clone(),
        created_at: ctx.timestamp,
    });

    append_social_feed(
        ctx,
        ctx.sender,
        "chat",
        format!("{{\"channel_id\":\"{}\",\"body\":\"{}\"}}", cid, message_body),
    );

    Ok(())
}

fn validate_channel_access(
    ctx: &ReducerContext,
    channel_type: u8,
    scope_id: &str,
) -> Result<(), String> {
    match channel_type {
        CHANNEL_TYPE_GENERAL => Ok(()),
        CHANNEL_TYPE_REGION => {
            let session = ctx
                .db
                .session_state()
                .identity()
                .find(ctx.sender)
                .ok_or("active session required for region chat".to_string())?;
            ensure_region_scope(session, scope_id)
        }
        CHANNEL_TYPE_PARTY => {
            let in_party = ctx
                .db
                .party_member()
                .iter()
                .any(|m| m.party_id == scope_id && m.member_identity == ctx.sender);
            if !in_party {
                return Err("party chat requires party membership".to_string());
            }
            Ok(())
        }
        CHANNEL_TYPE_GUILD => {
            let in_guild = ctx
                .db
                .guild_member()
                .iter()
                .any(|m| m.guild_id == scope_id && m.member_identity == ctx.sender);
            if !in_guild {
                return Err("guild chat requires guild membership".to_string());
            }
            Ok(())
        }
        _ => Err("unsupported channel type".to_string()),
    }
}

fn ensure_region_scope(session: SessionState, scope_id: &str) -> Result<(), String> {
    let scope_region = scope_id
        .parse::<u64>()
        .map_err(|_| "region channel scope_id must be u64 region id".to_string())?;
    if session.region_id != scope_region {
        return Err("region chat scope mismatch".to_string());
    }
    Ok(())
}
