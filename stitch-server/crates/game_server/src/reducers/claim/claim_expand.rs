use spacetimedb::{ReducerContext, Table};

use crate::services::permission_check::{check_permission, PERMISSION_BUILD};
use crate::tables::player_state_trait;
use crate::tables::{
    claim_local_state_trait, claim_state_trait, claim_tile_state_trait, ClaimTileState,
};

#[spacetimedb::reducer]
pub fn claim_expand(
    ctx: &ReducerContext,
    claim_id: u64,
    x: i32,
    z: i32,
    dimension: u16,
) -> Result<(), String> {
    let player = ctx
        .db
        .player_state()
        .identity()
        .filter(&ctx.sender)
        .next()
        .ok_or("Player not found".to_string())?;

    let claim = ctx
        .db
        .claim_state()
        .claim_id()
        .find(&claim_id)
        .ok_or("Claim not found".to_string())?;

    check_permission(
        ctx,
        player.entity_id,
        claim.claim_id,
        Some(claim_id),
        PERMISSION_BUILD,
    )?;

    if ctx.db.claim_tile_state().iter().any(|tile| {
        tile.claim_id == claim_id && tile.x == x && tile.z == z && tile.dimension == dimension
    }) {
        return Err("Tile already claimed".to_string());
    }

    ctx.db.claim_tile_state().insert(ClaimTileState {
        entity_id: ctx.random(),
        claim_id,
        x,
        z,
        dimension,
    });

    if let Some(mut local) = ctx.db.claim_local_state().entity_id().find(&claim_id) {
        local.num_tiles = local.num_tiles.saturating_add(1);
        ctx.db.claim_local_state().entity_id().update(local);
    }

    Ok(())
}
