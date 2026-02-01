use spacetimedb::{ReducerContext, Table};

use crate::services::permission_check::{check_permission, PERMISSION_COOWNER};
use crate::tables::{permission_state_trait, player_state_trait, PermissionState};

#[spacetimedb::reducer]
pub fn permission_edit(
    ctx: &ReducerContext,
    ordained_entity_id: u64,
    allowed_entity_id: u64,
    group: i32,
    rank: i32,
    claim_id: Option<u64>,
) -> Result<(), String> {
    let player = ctx
        .db
        .player_state()
        .identity()
        .filter(&ctx.sender)
        .next()
        .ok_or("Player not found".to_string())?;
    let subject_entity_id = player.entity_id;
    check_permission(
        ctx,
        subject_entity_id,
        ordained_entity_id,
        claim_id,
        PERMISSION_COOWNER,
    )?;

    let existing = ctx.db.permission_state().iter().find(|perm| {
        perm.ordained_entity_id == ordained_entity_id
            && perm.allowed_entity_id == allowed_entity_id
            && perm.group == group
    });

    if let Some(mut perm) = existing {
        perm.rank = rank;
        ctx.db.permission_state().entity_id().update(perm);
    } else {
        ctx.db.permission_state().insert(PermissionState {
            entity_id: ctx.random(),
            ordained_entity_id,
            allowed_entity_id,
            group,
            rank,
        });
    }

    Ok(())
}
