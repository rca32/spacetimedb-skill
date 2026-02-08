use spacetimedb::{Identity, ReducerContext, Table};

use super::helpers::append_social_feed;
use super::helpers::party_member_key;
use super::helpers::{PARTY_ROLE_LEADER, PARTY_ROLE_MEMBER};
use crate::tables::social::{party_member, party_state};

#[spacetimedb::reducer]
pub fn party_leave(ctx: &ReducerContext, party_id: String) -> Result<(), String> {
    let pid = party_id.trim().to_string();
    if pid.is_empty() {
        return Err("party_id must not be empty".to_string());
    }

    let mut party = ctx
        .db
        .party_state()
        .party_id()
        .find(pid.clone())
        .ok_or("party not found".to_string())?;

    let leaving_key = party_member_key(&pid, ctx.sender);
    if ctx
        .db
        .party_member()
        .member_key()
        .find(leaving_key.clone())
        .is_none()
    {
        return Err("not a party member".to_string());
    }

    ctx.db.party_member().member_key().delete(leaving_key);

    let remaining: Vec<crate::tables::PartyMember> = ctx
        .db
        .party_member()
        .iter()
        .filter(|m| m.party_id == pid)
        .collect();

    if remaining.is_empty() {
        ctx.db.party_state().party_id().delete(party.party_id);
        append_social_feed(
            ctx,
            ctx.sender,
            "party_disbanded",
            format!("{{\"party_id\":\"{}\"}}", pid),
        );
        return Ok(());
    }

    if party.leader_identity == ctx.sender {
        let next_leader = remaining[0].member_identity;
        party.leader_identity = next_leader;
        ctx.db.party_state().party_id().update(party);

        update_role(ctx, &pid, next_leader, PARTY_ROLE_LEADER)?;
        for member in remaining {
            if member.member_identity != next_leader {
                update_role(ctx, &pid, member.member_identity, PARTY_ROLE_MEMBER)?;
            }
        }
    }

    append_social_feed(
        ctx,
        ctx.sender,
        "party_left",
        format!("{{\"party_id\":\"{}\"}}", pid),
    );

    Ok(())
}

fn update_role(
    ctx: &ReducerContext,
    party_id: &str,
    member_identity: Identity,
    role: u8,
) -> Result<(), String> {
    let key = party_member_key(party_id, member_identity);
    let mut member = ctx
        .db
        .party_member()
        .member_key()
        .find(key)
        .ok_or("party member not found".to_string())?;
    member.role = role;
    ctx.db.party_member().member_key().update(member);
    Ok(())
}
