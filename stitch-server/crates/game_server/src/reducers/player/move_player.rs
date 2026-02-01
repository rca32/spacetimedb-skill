use spacetimedb::{ReducerContext, Table};

use crate::services::world_gen::{ChunkCoordinates, HexCoordinates};
use crate::tables::{
    action_state_trait, exploration_state_trait, nav_obstacle_trait, player_state_trait,
    resource_state_trait, transform_state_trait, ActionState, ExplorationState,
};

const ACTION_BLOCKING_TYPES: [u8; 2] = [3, 4];

#[spacetimedb::reducer]
pub fn move_player(
    ctx: &ReducerContext,
    target_hex_x: i32,
    target_hex_z: i32,
    is_running: bool,
) -> Result<(), String> {
    let identity = ctx.sender;
    let player = ctx
        .db
        .player_state()
        .identity()
        .filter(&identity)
        .next()
        .ok_or("Player not found".to_string())?;
    let entity_id = player.entity_id;

    let mut transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&entity_id)
        .ok_or("Transform not found".to_string())?;

    let mut resource = ctx
        .db
        .resource_state()
        .entity_id()
        .find(&entity_id)
        .ok_or("Resource state not found".to_string())?;

    if resource.hp == 0 {
        return Err("Incapacitated".to_string());
    }

    if is_action_blocking_move(ctx, entity_id) {
        return Err("Action blocks movement".to_string());
    }

    if !is_valid_coordinate(target_hex_x, target_hex_z) {
        return Err("Invalid coordinates".to_string());
    }

    if is_tile_blocked(ctx, target_hex_x, target_hex_z, transform.dimension) {
        return Err("Target tile blocked".to_string());
    }

    let move_cost = if is_running { 2 } else { 1 };
    if resource.stamina < move_cost {
        return Err("Not enough stamina".to_string());
    }

    resource.stamina -= move_cost;
    resource.last_stamina_use_ts = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    ctx.db.resource_state().entity_id().update(resource);

    let old_chunk = chunk_index(transform.hex_x, transform.hex_z);
    let new_chunk = chunk_index(target_hex_x, target_hex_z);

    transform.hex_x = target_hex_x;
    transform.hex_z = target_hex_z;
    transform.dest_hex_x = target_hex_x;
    transform.dest_hex_z = target_hex_z;
    transform.is_moving = false;
    transform.updated_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    ctx.db.transform_state().entity_id().update(transform);

    if old_chunk != new_chunk {
        update_exploration(ctx, entity_id, new_chunk)?;
    }

    Ok(())
}

fn is_action_blocking_move(ctx: &ReducerContext, entity_id: u64) -> bool {
    ctx.db
        .action_state()
        .entity_id()
        .find(&entity_id)
        .map(|action: ActionState| ACTION_BLOCKING_TYPES.contains(&action.action_type))
        .unwrap_or(false)
}

fn is_valid_coordinate(x: i32, z: i32) -> bool {
    x >= 1 && z >= 1
}

fn chunk_index(hex_x: i32, hex_z: i32) -> u64 {
    let hex = HexCoordinates { x: hex_x, z: hex_z };
    let coords = ChunkCoordinates::from_hex(&hex);
    coords.to_index() as u64
}

fn is_tile_blocked(ctx: &ReducerContext, hex_x: i32, hex_z: i32, dimension: u16) -> bool {
    ctx.db
        .nav_obstacle()
        .iter()
        .any(|obs| obs.blocked && obs.x == hex_x && obs.z == hex_z && obs.dimension == dimension)
}

fn update_exploration(ctx: &ReducerContext, entity_id: u64, new_chunk: u64) -> Result<(), String> {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;

    if let Some(mut exploration) = ctx.db.exploration_state().entity_id().find(&entity_id) {
        if !exploration.explored_chunks.contains(&new_chunk) {
            exploration.explored_chunks.push(new_chunk);
            exploration.last_explored_at = now;
            ctx.db.exploration_state().entity_id().update(exploration);
        }
        return Ok(());
    }

    ctx.db.exploration_state().insert(ExplorationState {
        entity_id,
        explored_chunks: vec![new_chunk],
        discovered_ruins: Vec::new(),
        discovered_claims: Vec::new(),
        last_explored_at: now,
    });

    Ok(())
}
