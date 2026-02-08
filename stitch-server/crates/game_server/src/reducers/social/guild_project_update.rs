use spacetimedb::{ReducerContext, Table};

use super::helpers::append_social_feed;
use super::helpers::guild_member_key;
use super::helpers::{GUILD_ROLE_LEADER, GUILD_ROLE_OFFICER};
use crate::tables::social::{guild_member, guild_project, guild_state};
use crate::tables::GuildProject;

#[spacetimedb::reducer]
pub fn guild_project_update(
    ctx: &ReducerContext,
    guild_id: String,
    project_id: String,
    title: String,
    progress_permille: u16,
) -> Result<(), String> {
    let gid = guild_id.trim().to_string();
    let pid = project_id.trim().to_string();
    let ttl = title.trim().to_string();

    if gid.is_empty() {
        return Err("guild_id must not be empty".to_string());
    }
    if pid.is_empty() {
        return Err("project_id must not be empty".to_string());
    }
    if ttl.is_empty() {
        return Err("title must not be empty".to_string());
    }
    if progress_permille > 1000 {
        return Err("progress_permille must be <= 1000".to_string());
    }

    let _guild = ctx
        .db
        .guild_state()
        .guild_id()
        .find(gid.clone())
        .ok_or("guild not found".to_string())?;

    let actor = ctx
        .db
        .guild_member()
        .member_key()
        .find(guild_member_key(&gid, ctx.sender))
        .ok_or("guild membership required".to_string())?;

    if actor.role != GUILD_ROLE_OFFICER && actor.role != GUILD_ROLE_LEADER {
        return Err("insufficient guild role".to_string());
    }

    let next = GuildProject {
        project_id: pid.clone(),
        guild_id: gid.clone(),
        title: ttl,
        progress_permille,
        updated_at: ctx.timestamp,
    };

    if ctx.db.guild_project().project_id().find(pid.clone()).is_some() {
        ctx.db.guild_project().project_id().update(next);
    } else {
        ctx.db.guild_project().insert(next);
    }

    append_social_feed(
        ctx,
        ctx.sender,
        "guild_project_updated",
        format!(
            "{{\"guild_id\":\"{}\",\"project_id\":\"{}\",\"progress_permille\":{}}}",
            gid, pid, progress_permille
        ),
    );

    Ok(())
}
