use spacetimedb::ReducerContext;

use crate::services::hex_coords::DEFAULT_WORLD_DIMENSION_ID;
use crate::tables::{ResourceGenDef, WorldGenParams};
use spacetimedb::TimeDuration;

const RESOURCE_REQUEST_MAX: u32 = 1_000;

#[spacetimedb::reducer]
pub fn set_worldgen_params(
    ctx: &ReducerContext,
    enabled: bool,
    seed: u64,
    size_x_chunks: i32,
    size_y_chunks: i32,
    sea_level: i16,
    regenerate_on_start: bool,
) -> Result<(), String> {
    crate::worldgen::ensure_default_worldgen_config(ctx);
    let mut params: WorldGenParams = crate::worldgen::load_worldgen_params(ctx);
    params.enabled = enabled;
    params.seed = seed;
    params.size_x_chunks = size_x_chunks;
    params.size_y_chunks = size_y_chunks;
    params.sea_level = sea_level;
    params.regenerate_on_start = regenerate_on_start;
    params.updated_at = ctx.timestamp;

    crate::worldgen::upsert_worldgen_params(ctx, params);
    Ok(())
}

#[spacetimedb::reducer]
pub fn generate_world(
    ctx: &ReducerContext,
    region_id: u64,
    seed: u64,
    size_x_chunks: i32,
    size_y_chunks: i32,
    overwrite: bool,
) -> Result<(), String> {
    generate_world_in_dimension(
        ctx,
        region_id,
        DEFAULT_WORLD_DIMENSION_ID,
        seed,
        size_x_chunks,
        size_y_chunks,
        overwrite,
    )
}

#[spacetimedb::reducer]
pub fn generate_world_in_dimension(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    seed: u64,
    size_x_chunks: i32,
    size_y_chunks: i32,
    overwrite: bool,
) -> Result<(), String> {
    crate::worldgen::ensure_default_worldgen_config(ctx);
    let params = update_worldgen_params_for_generation(ctx, seed, size_x_chunks, size_y_chunks);
    let summary = crate::worldgen::generate_region_in_dimension(
        ctx,
        region_id,
        dimension_id,
        &params,
        overwrite,
    )?;
    log::info!(
        "generate_world complete: region_id={} dimension_id={} chunks={} resources={} seed={}",
        region_id,
        dimension_id,
        summary.chunk_count,
        summary.resource_count,
        params.seed
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn generate_world_from_params(
    ctx: &ReducerContext,
    region_id: u64,
    overwrite: bool,
) -> Result<(), String> {
    generate_world_from_params_in_dimension(ctx, region_id, DEFAULT_WORLD_DIMENSION_ID, overwrite)
}

#[spacetimedb::reducer]
pub fn generate_world_from_params_in_dimension(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    overwrite: bool,
) -> Result<(), String> {
    crate::worldgen::ensure_default_worldgen_config(ctx);
    let params = crate::worldgen::load_worldgen_params(ctx);
    let summary = crate::worldgen::generate_region_in_dimension(
        ctx,
        region_id,
        dimension_id,
        &params,
        overwrite,
    )?;
    log::info!(
        "generate_world_from_params complete: region_id={} dimension_id={} chunks={} resources={} seed={}",
        region_id,
        dimension_id,
        summary.chunk_count,
        summary.resource_count,
        params.seed
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn regenerate_chunks(
    ctx: &ReducerContext,
    region_id: u64,
    from_chunk_x: i32,
    to_chunk_x: i32,
    from_chunk_y: i32,
    to_chunk_y: i32,
) -> Result<(), String> {
    regenerate_chunks_in_dimension(
        ctx,
        region_id,
        DEFAULT_WORLD_DIMENSION_ID,
        from_chunk_x,
        to_chunk_x,
        from_chunk_y,
        to_chunk_y,
    )
}

#[spacetimedb::reducer]
pub fn regenerate_chunks_in_dimension(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    from_chunk_x: i32,
    to_chunk_x: i32,
    from_chunk_y: i32,
    to_chunk_y: i32,
) -> Result<(), String> {
    crate::worldgen::ensure_default_worldgen_config(ctx);
    let summary = crate::worldgen::regenerate_chunk_range_in_dimension(
        ctx,
        region_id,
        dimension_id,
        from_chunk_x,
        to_chunk_x,
        from_chunk_y,
        to_chunk_y,
    )?;
    log::info!(
        "regenerate_chunks complete: region_id={} dimension_id={} chunks={} resources={} range=({},{})->({},{})",
        region_id,
        dimension_id,
        summary.chunk_count,
        summary.resource_count,
        from_chunk_x,
        from_chunk_y,
        to_chunk_x,
        to_chunk_y
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn harvest_resource(
    ctx: &ReducerContext,
    entity_id: u64,
    requested_amount: u32,
) -> Result<u32, String> {
    if requested_amount == 0 {
        return Err("requested_amount must be greater than 0".to_string());
    }
    if requested_amount > RESOURCE_REQUEST_MAX {
        return Err(format!("requested_amount must be <= {RESOURCE_REQUEST_MAX}"));
    }

    let mut node = ctx
        .db
        .resource_node()
        .entity_id()
        .find(entity_id)
        .ok_or_else(|| format!("resource not found: entity_id={entity_id}"))?;

    if node.is_depleted && node.amount == 0 && ctx.timestamp.duration_since(node.respawn_at).is_none() {
        return Err(format!(
            "resource depleted: entity_id={entity_id}"
        ));
    }

    if node.amount == 0 {
        if let Some(def) = find_resource_gen_def(ctx, node.resource_def_id) {
            node.is_depleted = false;
            node.respawn_at = ctx.timestamp;
            node.amount = def.max_amount.min(node.max_amount.max(1));
            node.max_amount = def.max_amount;
            ctx.db.resource_node().entity_id().update(node);
        }
    }

    if node.amount == 0 {
        return Ok(0);
    }

    let mined = node.amount.min(requested_amount);
    node.amount = node.amount.saturating_sub(mined);

    if node.amount == 0 {
        let respawn_seconds = find_resource_gen_def(ctx, node.resource_def_id)
            .map(|def| def.respawn_seconds)
            .unwrap_or(0);
        node.is_depleted = true;
        node.respawn_at = if respawn_seconds == 0 {
            ctx.timestamp
        } else {
            ctx.timestamp + TimeDuration::from_duration(std::time::Duration::from_secs(respawn_seconds as u64))
        };
    } else {
        node.is_depleted = false;
    }

    ctx.db.resource_node().entity_id().update(node);

    Ok(mined)
}

#[spacetimedb::reducer]
pub fn get_chunk_payload(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
) -> Result<(), String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }

    ctx.db
        .terrain_chunk_payload()
        .iter()
        .find(|row| {
            row.region_id == region_id
                && row.dimension_id == dimension_id
                && row.chunk_x == chunk_x
                && row.chunk_y == chunk_y
        })
        .ok_or_else(|| {
            format!(
                "chunk payload not found: region_id={region_id}, dimension_id={dimension_id}, chunk_x={chunk_x}, chunk_y={chunk_y}"
            )
        })?;

    Ok(())
}

fn find_resource_gen_def(ctx: &ReducerContext, resource_def_id: u64) -> Option<ResourceGenDef> {
    ctx.db
        .resource_gen_def()
        .iter()
        .find(|row| row.resource_def_id == resource_def_id)
        .or_else(|| {
            if let Ok(resource_type) = u8::try_from(resource_def_id) {
                ctx.db
                    .resource_gen_def()
                    .resource_type()
                    .find(resource_type)
            } else {
                None
            }
        })
}

fn update_worldgen_params_for_generation(
    ctx: &ReducerContext,
    seed: u64,
    size_x_chunks: i32,
    size_y_chunks: i32,
) -> WorldGenParams {
    let mut params = crate::worldgen::load_worldgen_params(ctx);
    params.seed = seed;
    params.size_x_chunks = size_x_chunks;
    params.size_y_chunks = size_y_chunks;
    params.updated_at = ctx.timestamp;
    crate::worldgen::upsert_worldgen_params(
        ctx,
        WorldGenParams {
            id: params.id,
            enabled: params.enabled,
            version: params.version,
            seed: params.seed,
            size_x_chunks: params.size_x_chunks,
            size_y_chunks: params.size_y_chunks,
            sea_level: params.sea_level,
            noise_scale: params.noise_scale,
            noise_octaves: params.noise_octaves,
            noise_persistence: params.noise_persistence,
            noise_lacunarity: params.noise_lacunarity,
            terrain_chunk_size: params.terrain_chunk_size,
            regenerate_on_start: params.regenerate_on_start,
            updated_at: params.updated_at,
        },
    );
    params
}
