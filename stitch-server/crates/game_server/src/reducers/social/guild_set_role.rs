use spacetimedb::{Identity, ReducerContext};

use super::helpers::append_social_feed;
use super::helpers::guild_member_key;
use super::helpers::{GUILD_ROLE_LEADER, GUILD_ROLE_MEMBER, GUILD_ROLE_OFFICER};
use crate::tables::social::{guild_member, guild_state};

#[spacetimedb::reducer]
pub fn guild_set_role(
    ctx: &ReducerContext,
    guild_id: String,
    member_identity: Identity,
    role: u8,
) -> Result<(), String> {
    let gid = guild_id.trim().to_string();
    if gid.is_empty() {
        return Err("guild_id must not be empty".to_string());
    }
    if !is_valid_role(role) {
        return Err("invalid role".to_string());
    }

    let _guild = ctx
        .db
        .guild_state()
        .guild_id()
        .find(gid.clone())
        .ok_or("guild not found".to_string())?;

    let actor_key = guild_member_key(&gid, ctx.sender);
    let actor = ctx
        .db
        .guild_member()
        .member_key()
        .find(actor_key)
        .ok_or("only guild members can set roles".to_string())?;

    if actor.role != GUILD_ROLE_LEADER {
        return Err("only guild leader can set roles".to_string());
    }

    let target_key = guild_member_key(&gid, member_identity);
    let mut target = ctx
        .db
        .guild_member()
        .member_key()
        .find(target_key)
        .ok_or("target member not found".to_string())?;

    if member_identity == ctx.sender && role != GUILD_ROLE_LEADER {
        return Err("leader cannot demote self".to_string());
    }

    target.role = role;
    ctx.db.guild_member().member_key().update(target);

    if role == GUILD_ROLE_LEADER && member_identity != ctx.sender {
        set_member_role(ctx, &gid, ctx.sender, GUILD_ROLE_OFFICER)?;
    }

    append_social_feed(
        ctx,
        ctx.sender,
        "guild_role_set",
        format!(
            "{{\"guild_id\":\"{}\",\"target\":\"{}\",\"role\":{}}}",
            gid, member_identity, role
        ),
    );

    Ok(())
}

fn is_valid_role(role: u8) -> bool {
    role == GUILD_ROLE_MEMBER || role == GUILD_ROLE_OFFICER || role == GUILD_ROLE_LEADER
}

fn set_member_role(
    ctx: &ReducerContext,
    guild_id: &str,
    member_identity: Identity,
    role: u8,
) -> Result<(), String> {
    let key = guild_member_key(guild_id, member_identity);
    let mut member = ctx
        .db
        .guild_member()
        .member_key()
        .find(key)
        .ok_or("member not found".to_string())?;
    member.role = role;
    ctx.db.guild_member().member_key().update(member);
    Ok(())
}
