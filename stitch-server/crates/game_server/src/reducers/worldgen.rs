use spacetimedb::{ReducerContext, Table, Timestamp};

use crate::services::world_gen::{generate_chunk, ChunkCoordinates};
use crate::tables::{
    balance_params_trait, resource_node_trait, resource_regen_log_trait, terrain_chunk_trait,
    world_gen_params_trait, ResourceRegenLog, WorldGenParams,
};

#[spacetimedb::reducer]
pub fn generate_world(
    ctx: &ReducerContext,
    seed: u64,
    size_x_chunks: i32,
    size_z_chunks: i32,
) -> Result<(), String> {
    let params = WorldGenParams {
        id: 0,
        seed,
        world_width_chunks: size_x_chunks,
        world_height_chunks: size_z_chunks,
        sea_level: 0,
    };

    if ctx.db.world_gen_params().id().find(&0).is_some() {
        ctx.db.world_gen_params().id().update(params);
    } else {
        ctx.db.world_gen_params().insert(params);
    }

    for z in 0..size_z_chunks {
        for x in 0..size_x_chunks {
            let coords = ChunkCoordinates { x, z, dimension: 0 };
            let chunk = generate_chunk(seed, coords);
            if ctx
                .db
                .terrain_chunk()
                .chunk_id()
                .find(&chunk.chunk_id)
                .is_some()
            {
                ctx.db.terrain_chunk().chunk_id().update(chunk);
            } else {
                ctx.db.terrain_chunk().insert(chunk);
            }
        }
    }

    Ok(())
}

#[spacetimedb::reducer]
pub fn get_chunk_data(ctx: &ReducerContext, chunk_x: i32, chunk_z: i32) -> Result<(), String> {
    let coords = ChunkCoordinates {
        x: chunk_x,
        z: chunk_z,
        dimension: 0,
    };
    let chunk_id = coords.to_index();

    if ctx.db.terrain_chunk().chunk_id().find(&chunk_id).is_some() {
        return Ok(());
    }

    let seed = ctx
        .db
        .world_gen_params()
        .id()
        .find(&0)
        .map(|params| params.seed)
        .unwrap_or(0);
    let chunk = generate_chunk(seed, coords);
    ctx.db.terrain_chunk().insert(chunk);
    Ok(())
}

#[spacetimedb::reducer]
pub fn harvest_resource(
    ctx: &ReducerContext,
    resource_id: u64,
    _player_id: u64,
    amount: u32,
) -> Result<(), String> {
    let mut resource = ctx
        .db
        .resource_node()
        .id()
        .find(&resource_id)
        .ok_or("Resource not found".to_string())?;

    if resource.is_depleted {
        return Err("Resource depleted".to_string());
    }

    let actual_amount = amount.min(resource.current_amount);
    resource.current_amount -= actual_amount;
    if resource.current_amount == 0 {
        resource.is_depleted = true;
        let respawn_seconds = get_param_u64(ctx, "resource.respawn_seconds").unwrap_or(300);
        let respawn_at_micros = ctx
            .timestamp
            .to_micros_since_unix_epoch()
            .saturating_add(respawn_seconds.saturating_mul(1_000_000) as i64);
        resource.respawn_at = Some(Timestamp::from_micros_since_unix_epoch(respawn_at_micros));

        let log = ResourceRegenLog {
            entity_id: resource.id,
            original_hex_x: resource.hex_x,
            original_hex_z: resource.hex_z,
            chunk_id: resource.chunk_id,
            resource_def_id: resource.resource_def_id,
            depleted_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
            respawn_at: respawn_at_micros as u64,
        };
        if ctx
            .db
            .resource_regen_log()
            .entity_id()
            .find(&resource.id)
            .is_some()
        {
            ctx.db.resource_regen_log().entity_id().update(log);
        } else {
            ctx.db.resource_regen_log().insert(log);
        }
    }

    let remaining = resource.current_amount;
    ctx.db.resource_node().id().update(resource);

    let _ = (actual_amount, remaining);
    Ok(())
}

fn get_param_u64(ctx: &ReducerContext, key: &str) -> Option<u64> {
    ctx.db
        .balance_params()
        .key()
        .find(&key.to_string())
        .and_then(|param| param.value.parse().ok())
}
