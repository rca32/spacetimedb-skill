use spacetimedb::{ReducerContext, Table};

use crate::tables::player_state_trait;
use crate::tables::{
    claim_local_state_trait, claim_member_state_trait, claim_state_trait, claim_tech_state_trait,
    claim_tile_state_trait, ClaimLocalState, ClaimMemberState, ClaimState, ClaimTechState,
    ClaimTileState,
};

#[spacetimedb::reducer]
pub fn claim_totem_place(
    ctx: &ReducerContext,
    claim_id: u64,
    region_id: u64,
    name: String,
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

    if ctx.db.claim_state().claim_id().find(&claim_id).is_some() {
        return Err("Claim already exists".to_string());
    }

    ctx.db.claim_state().insert(ClaimState {
        claim_id,
        owner_player_entity_id: player.entity_id,
        owner_building_entity_id: 0,
        region_id,
        name,
    });

    ctx.db.claim_tile_state().insert(ClaimTileState {
        entity_id: ctx.random(),
        claim_id,
        x,
        z,
        dimension,
    });

    ctx.db.claim_member_state().insert(ClaimMemberState {
        entity_id: ctx.random(),
        claim_id,
        player_entity_id: player.entity_id,
        inventory_permission: true,
        build_permission: true,
        officer_permission: true,
        co_owner_permission: true,
    });

    ctx.db.claim_local_state().insert(ClaimLocalState {
        entity_id: claim_id,
        supplies: 0,
        num_tiles: 1,
        num_tile_neighbors: 0,
        treasury: 0,
    });

    ctx.db.claim_tech_state().insert(ClaimTechState {
        entity_id: claim_id,
        max_tiles: 10,
        tech_level: 0,
    });

    Ok(())
}
