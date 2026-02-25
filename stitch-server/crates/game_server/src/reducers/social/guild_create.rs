use spacetimedb::{Identity, ReducerContext, Table};

use super::helpers::append_social_feed;
use super::helpers::guild_member_key;
use super::helpers::GUILD_ROLE_LEADER;
use crate::tables::social::{guild_member, guild_state};
use crate::tables::{GuildMember, GuildState};

#[spacetimedb::reducer]
pub fn guild_create(ctx: &ReducerContext, guild_id: String, name: String) -> Result<(), String> {
    let gid = guild_id.trim().to_string();
    let guild_name = name.trim().to_string();

    if gid.is_empty() {
        return Err("guild_id must not be empty".to_string());
    }
    if guild_name.is_empty() {
        return Err("name must not be empty".to_string());
    }

    if ctx.db.guild_state().guild_id().find(gid.clone()).is_some() {
        return Err("guild_id already exists".to_string());
    }
    if find_guild_id_by_identity(ctx, ctx.sender()).is_some() {
        return Err("already in a guild".to_string());
    }
    if ctx.db.guild_state().iter().any(|g| g.name == guild_name) {
        return Err("guild name already exists".to_string());
    }

    ctx.db.guild_state().insert(GuildState {
        guild_id: gid.clone(),
        name: guild_name,
        founder_identity: ctx.sender(),
        created_at: ctx.timestamp,
    });
    ctx.db.guild_member().insert(GuildMember {
        member_key: guild_member_key(&gid, ctx.sender()),
        guild_id: gid.clone(),
        member_identity: ctx.sender(),
        role: GUILD_ROLE_LEADER,
        joined_at: ctx.timestamp,
    });

    append_social_feed(
        ctx,
        ctx.sender(),
        "guild_created",
        format!("{{\"guild_id\":\"{}\"}}", gid),
    );

    Ok(())
}

pub(crate) fn find_guild_id_by_identity(
    ctx: &ReducerContext,
    identity: Identity,
) -> Option<String> {
    ctx.db
        .guild_member()
        .iter()
        .find(|m| m.member_identity == identity)
        .map(|m| m.guild_id)
}
