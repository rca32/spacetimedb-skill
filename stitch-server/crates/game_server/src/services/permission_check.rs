use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    claim_member_state_trait, claim_state_trait, permission_state_trait, rent_state_trait,
};

pub const GROUP_PLAYER: i32 = 0;
pub const GROUP_CLAIM: i32 = 1;
pub const GROUP_EMPIRE: i32 = 2;
pub const GROUP_EVERYONE: i32 = 3;

pub const PERMISSION_PENDING_VISITOR: i32 = 0;
pub const PERMISSION_VISITOR: i32 = 1;
pub const PERMISSION_USAGE: i32 = 2;
pub const PERMISSION_INVENTORY: i32 = 3;
pub const PERMISSION_BUILD: i32 = 4;
pub const PERMISSION_COOWNER: i32 = 5;
pub const PERMISSION_OVERRIDE_NO_ACCESS: i32 = 6;
pub const PERMISSION_OWNER: i32 = 7;

pub fn check_permission(
    ctx: &ReducerContext,
    subject_entity_id: u64,
    ordained_entity_id: u64,
    claim_id: Option<u64>,
    required_rank: i32,
) -> Result<(), String> {
    if let Some(claim_id) = claim_id {
        if is_claim_owner(ctx, claim_id, subject_entity_id) {
            return Ok(());
        }
    }

    if has_override_no_access(ctx, subject_entity_id, ordained_entity_id, claim_id) {
        return Err("Access denied".to_string());
    }

    let best_rank = best_permission_rank(ctx, subject_entity_id, ordained_entity_id, claim_id);
    if best_rank >= required_rank {
        return Ok(());
    }

    Err("Insufficient permission".to_string())
}

pub fn is_rent_whitelisted(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    subject_entity_id: u64,
) -> bool {
    ctx.db
        .rent_state()
        .entity_id()
        .find(&housing_entity_id)
        .map(|rent| rent.white_list.contains(&subject_entity_id))
        .unwrap_or(true)
}

fn is_claim_owner(ctx: &ReducerContext, claim_id: u64, subject_entity_id: u64) -> bool {
    ctx.db
        .claim_state()
        .claim_id()
        .find(&claim_id)
        .map(|claim| claim.owner_player_entity_id == subject_entity_id)
        .unwrap_or(false)
}

fn has_override_no_access(
    ctx: &ReducerContext,
    subject_entity_id: u64,
    ordained_entity_id: u64,
    claim_id: Option<u64>,
) -> bool {
    ctx.db
        .permission_state()
        .iter()
        .filter(|perm| perm.ordained_entity_id == ordained_entity_id)
        .any(|perm| {
            perm.rank == PERMISSION_OVERRIDE_NO_ACCESS
                && is_permission_subject_match(
                    subject_entity_id,
                    claim_id,
                    perm.group,
                    perm.allowed_entity_id,
                )
        })
}

fn best_permission_rank(
    ctx: &ReducerContext,
    subject_entity_id: u64,
    ordained_entity_id: u64,
    claim_id: Option<u64>,
) -> i32 {
    let mut best = -1;
    for perm in ctx
        .db
        .permission_state()
        .iter()
        .filter(|perm| perm.ordained_entity_id == ordained_entity_id)
    {
        if is_permission_subject_match(
            subject_entity_id,
            claim_id,
            perm.group,
            perm.allowed_entity_id,
        ) {
            if perm.rank > best {
                best = perm.rank;
            }
        }
    }

    if let Some(claim_id) = claim_id {
        if let Some(member) = ctx
            .db
            .claim_member_state()
            .iter()
            .find(|m| m.claim_id == claim_id && m.player_entity_id == subject_entity_id)
        {
            if member.co_owner_permission {
                best = best.max(PERMISSION_COOWNER);
            }
            if member.build_permission {
                best = best.max(PERMISSION_BUILD);
            }
            if member.inventory_permission {
                best = best.max(PERMISSION_INVENTORY);
            }
        }
    }

    best
}

fn is_permission_subject_match(
    subject_entity_id: u64,
    claim_id: Option<u64>,
    group: i32,
    allowed_entity_id: u64,
) -> bool {
    match group {
        GROUP_PLAYER => allowed_entity_id == subject_entity_id,
        GROUP_CLAIM => claim_id
            .map(|cid| cid == allowed_entity_id)
            .unwrap_or(false),
        GROUP_EMPIRE => false,
        GROUP_EVERYONE => true,
        _ => false,
    }
}
