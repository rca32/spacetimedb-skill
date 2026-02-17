use spacetimedb::ReducerContext;

use crate::tables::WorldGenParams;

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
    crate::worldgen::ensure_default_worldgen_config(ctx);
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

    let summary = crate::worldgen::generate_region(ctx, region_id, &params, overwrite)?;
    log::info!(
        "generate_world complete: region_id={} chunks={} resources={} seed={}",
        region_id,
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
    crate::worldgen::ensure_default_worldgen_config(ctx);
    let params = crate::worldgen::load_worldgen_params(ctx);
    let summary = crate::worldgen::generate_region(ctx, region_id, &params, overwrite)?;
    log::info!(
        "generate_world_from_params complete: region_id={} chunks={} resources={} seed={}",
        region_id,
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
    crate::worldgen::ensure_default_worldgen_config(ctx);
    let summary = crate::worldgen::regenerate_chunk_range(
        ctx,
        region_id,
        from_chunk_x,
        to_chunk_x,
        from_chunk_y,
        to_chunk_y,
    )?;
    log::info!(
        "regenerate_chunks complete: region_id={} chunks={} resources={} range=({},{})->({},{})",
        region_id,
        summary.chunk_count,
        summary.resource_count,
        from_chunk_x,
        from_chunk_y,
        to_chunk_x,
        to_chunk_y
    );
    Ok(())
}
