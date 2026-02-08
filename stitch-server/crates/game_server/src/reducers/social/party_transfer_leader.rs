use spacetimedb::{Identity, ReducerContext};

use super::helpers::append_social_feed;
use super::helpers::party_member_key;
use super::helpers::{PARTY_ROLE_LEADER, PARTY_ROLE_MEMBER};
use crate::tables::social::{party_member, party_state};

#[spacetimedb::reducer]
pub fn party_transfer_leader(
    ctx: &ReducerContext,
    party_id: String,
    new_leader_identity: Identity,
) -> Result<(), String> {
    let pid = party_id.trim().to_string();
    if pid.is_empty() {
        return Err("party_id must not be empty".to_string());
    }
    if new_leader_identity == ctx.sender {
        return Err("new leader must be different from caller".to_string());
    }

    let mut party = ctx
        .db
        .party_state()
        .party_id()
        .find(pid.clone())
        .ok_or("party not found".to_string())?;

    if party.leader_identity != ctx.sender {
        return Err("only party leader can transfer leadership".to_string());
    }

    let next_key = party_member_key(&pid, new_leader_identity);
    if ctx.db.party_member().member_key().find(next_key).is_none() {
        return Err("new leader must be a party member".to_string());
    }

    party.leader_identity = new_leader_identity;
    ctx.db.party_state().party_id().update(party);

    set_member_role(ctx, &pid, ctx.sender, PARTY_ROLE_MEMBER)?;
    set_member_role(ctx, &pid, new_leader_identity, PARTY_ROLE_LEADER)?;

    append_social_feed(
        ctx,
        ctx.sender,
        "party_leader_changed",
        format!(
            "{{\"party_id\":\"{}\",\"new_leader\":\"{}\"}}",
            pid, new_leader_identity
        ),
    );

    Ok(())
}

fn set_member_role(
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
