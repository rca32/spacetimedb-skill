use spacetimedb::{ReducerContext, Table};

use super::helpers::append_social_feed;
use super::helpers::party_member_key;
use super::helpers::PARTY_ROLE_LEADER;
use crate::tables::session_state::session_state;
use crate::tables::social::{party_member, party_state};
use crate::tables::{PartyMember, PartyState};

#[spacetimedb::reducer]
pub fn party_create(ctx: &ReducerContext, party_id: String) -> Result<(), String> {
    let pid = party_id.trim().to_string();
    if pid.is_empty() {
        return Err("party_id must not be empty".to_string());
    }

    if ctx.db.party_state().party_id().find(pid.clone()).is_some() {
        return Err("party_id already exists".to_string());
    }

    if find_party_id_by_identity(ctx, ctx.sender()).is_some() {
        return Err("already in a party".to_string());
    }

    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender())
        .ok_or("active session required".to_string())?;

    ctx.db.party_state().insert(PartyState {
        party_id: pid.clone(),
        leader_identity: ctx.sender(),
        region_id: session.region_id,
        created_at: ctx.timestamp,
    });
    ctx.db.party_member().insert(PartyMember {
        member_key: party_member_key(&pid, ctx.sender()),
        party_id: pid.clone(),
        member_identity: ctx.sender(),
        role: PARTY_ROLE_LEADER,
        joined_at: ctx.timestamp,
    });

    append_social_feed(
        ctx,
        ctx.sender(),
        "party_created",
        format!("{{\"party_id\":\"{}\"}}", pid),
    );
    Ok(())
}

pub(crate) fn find_party_id_by_identity(
    ctx: &ReducerContext,
    identity: spacetimedb::Identity,
) -> Option<String> {
    ctx.db
        .party_member()
        .iter()
        .find(|m| m.member_identity == identity)
        .map(|m| m.party_id)
}
pub(crate) fn party_member_count(ctx: &ReducerContext, party_id: &str) -> usize {
    ctx.db
        .party_member()
        .iter()
        .filter(|m| m.party_id == party_id)
        .count()
}
