use spacetimedb::{ReducerContext, Table};

use super::guild_create::find_guild_id_by_identity;
use super::helpers::append_social_feed;
use super::helpers::guild_member_key;
use super::helpers::GUILD_ROLE_MEMBER;
use crate::tables::social::{guild_member, guild_state};
use crate::tables::GuildMember;

#[spacetimedb::reducer]
pub fn guild_join(ctx: &ReducerContext, guild_id: String) -> Result<(), String> {
    let gid = guild_id.trim().to_string();
    if gid.is_empty() {
        return Err("guild_id must not be empty".to_string());
    }

    if find_guild_id_by_identity(ctx, ctx.sender()).is_some() {
        return Err("already in a guild".to_string());
    }

    let _guild = ctx
        .db
        .guild_state()
        .guild_id()
        .find(gid.clone())
        .ok_or("guild not found".to_string())?;

    ctx.db.guild_member().insert(GuildMember {
        member_key: guild_member_key(&gid, ctx.sender()),
        guild_id: gid.clone(),
        member_identity: ctx.sender(),
        role: GUILD_ROLE_MEMBER,
        joined_at: ctx.timestamp,
    });

    append_social_feed(
        ctx,
        ctx.sender(),
        "guild_joined",
        format!("{{\"guild_id\":\"{}\"}}", gid),
    );

    Ok(())
}
