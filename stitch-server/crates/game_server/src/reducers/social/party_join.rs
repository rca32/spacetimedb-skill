use spacetimedb::{ReducerContext, Table};

use super::helpers::append_social_feed;
use super::helpers::party_member_key;
use super::helpers::PARTY_ROLE_MEMBER;
use super::party_create::{find_party_id_by_identity, party_member_count};
use crate::tables::social::{party_member, party_state};
use crate::tables::PartyMember;

const PARTY_MEMBER_LIMIT: usize = 5;

#[spacetimedb::reducer]
pub fn party_join(ctx: &ReducerContext, party_id: String) -> Result<(), String> {
    let pid = party_id.trim().to_string();
    if pid.is_empty() {
        return Err("party_id must not be empty".to_string());
    }

    if find_party_id_by_identity(ctx, ctx.sender).is_some() {
        return Err("already in a party".to_string());
    }

    let _party = ctx
        .db
        .party_state()
        .party_id()
        .find(pid.clone())
        .ok_or("party not found".to_string())?;

    if party_member_count(ctx, &pid) >= PARTY_MEMBER_LIMIT {
        return Err("party is full".to_string());
    }

    ctx.db.party_member().insert(PartyMember {
        member_key: party_member_key(&pid, ctx.sender),
        party_id: pid.clone(),
        member_identity: ctx.sender,
        role: PARTY_ROLE_MEMBER,
        joined_at: ctx.timestamp,
    });

    append_social_feed(
        ctx,
        ctx.sender,
        "party_joined",
        format!("{{\"party_id\":\"{}\"}}", pid),
    );

    Ok(())
}
