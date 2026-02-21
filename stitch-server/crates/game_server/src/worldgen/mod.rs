use std::collections::{HashMap, HashSet, VecDeque};
use std::time::Duration;

use spacetimedb::{ReducerContext, Table, TimeDuration, Timestamp};

use crate::services::hex_coords::DEFAULT_WORLD_DIMENSION_ID;
use crate::tables::world_gen::{
    biome_gen_def, resource_clump_def, resource_gen_def, world_gen_params,
};
use crate::tables::world_state::{
    region_state, resource_node, terrain_chunk, terrain_chunk_payload, terrain_chunk_stream,
    worldgen_chunk_generation_queue,
};
use crate::tables::{
    BiomeGenDef, RegionState, ResourceClumpDef, ResourceGenDef, ResourceNode, TerrainChunk,
    TerrainChunkPayload, TerrainChunkStream, WorldGenParams, WorldgenChunkGenerationQueue,
};

pub const WORLD_GEN_PARAMS_ID: u64 = 1;
pub const WORLD_GEN_VERSION_V1: u32 = 1;
pub const DEFAULT_WORLD_CHUNK_SIZE: u16 = 32;
pub const CELL_PAYLOAD_VERSION_V1: u16 = 1;
pub const CELL_PAYLOAD_VERSION_V2: u16 = 2;

const DEFAULT_REGION_STATUS: u8 = 1;
const DEFAULT_REGION_SHARD_LOAD_PERMILLE: u16 = 100;
const DEFAULT_NOISE_SCALE: f32 = 0.035;
const DEFAULT_NOISE_OCTAVES: u8 = 5;
const DEFAULT_NOISE_PERSISTENCE: f32 = 0.5;
const DEFAULT_NOISE_LACUNARITY: f32 = 2.0;
const DEFAULT_LAZY_SEED_RADIUS_CHUNKS: i16 = 1;
const DEFAULT_LAZY_CHUNKS_PER_TICK: u16 = 4;
const DEFAULT_LAZY_PREFETCH_RING: i16 = 1;

const MIN_LAKE_SIZE_CELLS: usize = 6;
const LAKE_DEPTH_MAX: i16 = 5;
const RIVER_DEPTH: i16 = 2;
const RIVER_FLOW_MAX: i16 = 1_000;
const RIVER_FLOW_MIN: i16 = 200;
const RIVER_KNN: usize = 3;
const RESOURCE_MAX_FLATNESS_I16: i16 = 8;
const CELL_PAYLOAD_FIELDS_V1: usize = 4;
const CELL_PAYLOAD_FIELDS_V2: usize = 8;

#[derive(Debug, Clone, Copy, Default)]
pub struct GenerateSummary {
    pub chunk_count: u32,
    pub resource_count: u32,
}

#[derive(Debug, Clone, Copy)]
struct TerrainCellSample {
    elevation: i16,
    water_level: i16,
    biome_id: u16,
    temperature: i16,
    moisture: i16,
    water_body_type: u8,
    distance_to_water_proxy: i16,
    distance_to_sea_proxy: i16,
    river_flow_permille: i16,
}

#[derive(Debug, Clone)]
struct LakeBody {
    id: usize,
    cells: Vec<usize>,
    shore_cells: Vec<usize>,
    center_index: usize,
    surface_level: i16,
}

#[derive(Debug, Clone)]
struct RiverPath {
    from_lake_id: usize,
    to_lake_id: usize,
    path: Vec<usize>,
    cost: i32,
}

#[derive(Debug, Clone, Copy)]
struct CellCoord {
    local_x: usize,
    local_z: usize,
    hex_x: i32,
    hex_z: i32,
}

struct GenerationConfig {
    params: WorldGenParams,
    biome_defs: Vec<BiomeGenDef>,
    resource_defs: Vec<ResourceGenDef>,
    clumps_by_resource: HashMap<u8, Vec<ClumpTemplate>>,
}

#[derive(Debug, Clone)]
struct ClumpTemplate {
    clump_id: i32,
    members: Vec<ClumpMember>,
}

#[derive(Debug, Clone, Copy)]
struct ClumpMember {
    member_index: u8,
    dx: i8,
    dz: i8,
    is_center: bool,
}

struct ChunkBuild {
    chunk: TerrainChunk,
    chunk_stream: TerrainChunkStream,
    chunk_payload: TerrainChunkPayload,
    resources: Vec<ResourceNode>,
}

struct RegionHydroCache {
    cells: Vec<TerrainCellSample>,
    coords: Vec<CellCoord>,
    indices_by_chunk: HashMap<(i32, i32), Vec<usize>>,
}

pub fn ensure_default_worldgen_config(ctx: &ReducerContext) {
    if ctx
        .db
        .world_gen_params()
        .id()
        .find(WORLD_GEN_PARAMS_ID)
        .is_none()
    {
        ctx.db
            .world_gen_params()
            .insert(default_worldgen_params(ctx));
    }

    if ctx.db.biome_gen_def().iter().next().is_none() {
        seed_default_biome_defs(ctx);
    }
    if ctx.db.resource_gen_def().iter().next().is_none() {
        seed_default_resource_defs(ctx);
    }
    if ctx.db.resource_clump_def().iter().next().is_none() {
        seed_default_resource_clumps(ctx);
    }
}

pub fn load_worldgen_params(ctx: &ReducerContext) -> WorldGenParams {
    if let Some(params) = ctx.db.world_gen_params().id().find(WORLD_GEN_PARAMS_ID) {
        return params;
    }

    let defaults = default_worldgen_params(ctx);
    ctx.db
        .world_gen_params()
        .insert(default_worldgen_params(ctx));
    defaults
}

pub fn upsert_worldgen_params(ctx: &ReducerContext, params: WorldGenParams) {
    if ctx
        .db
        .world_gen_params()
        .id()
        .find(WORLD_GEN_PARAMS_ID)
        .is_some()
    {
        ctx.db.world_gen_params().id().update(params);
    } else {
        ctx.db.world_gen_params().insert(params);
    }
}

pub fn ensure_world_generated(
    ctx: &ReducerContext,
    region_id: u64,
) -> Result<GenerateSummary, String> {
    ensure_world_generated_in_dimension(ctx, region_id, DEFAULT_WORLD_DIMENSION_ID)
}

pub fn ensure_world_generated_in_dimension(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
) -> Result<GenerateSummary, String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }

    ensure_default_worldgen_config(ctx);
    let params = load_worldgen_params(ctx);

    if !params.enabled {
        return Ok(GenerateSummary::default());
    }

    let has_chunks = ctx
        .db
        .terrain_chunk()
        .iter()
        .any(|chunk| chunk.region_id == region_id && chunk.dimension_id == dimension_id);

    if has_chunks && !params.regenerate_on_start {
        let stream_backfilled = backfill_chunk_stream_from_chunks(ctx, region_id, dimension_id);
        let payload_backfilled = backfill_chunk_payload_from_chunks(ctx, region_id, dimension_id);
        if params.lazy_generation_enabled {
            enqueue_world_seed_window(ctx, region_id, dimension_id, &params);
        }
        return Ok(GenerateSummary {
            chunk_count: stream_backfilled.saturating_add(payload_backfilled),
            resource_count: 0,
        });
    }

    generate_region_in_dimension(ctx, region_id, dimension_id, &params, true)
}

pub fn generate_region(
    ctx: &ReducerContext,
    region_id: u64,
    params: &WorldGenParams,
    overwrite: bool,
) -> Result<GenerateSummary, String> {
    generate_region_in_dimension(
        ctx,
        region_id,
        DEFAULT_WORLD_DIMENSION_ID,
        params,
        overwrite,
    )
}

pub fn generate_region_in_dimension(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    params: &WorldGenParams,
    overwrite: bool,
) -> Result<GenerateSummary, String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }

    validate_params(params)?;
    ensure_region_exists(ctx, region_id);

    if overwrite {
        delete_region_world_data(ctx, region_id, dimension_id);
    }
    clear_chunk_generation_queue_for_region_dimension(ctx, region_id, dimension_id);

    if params.lazy_generation_enabled {
        let seed_coords = seed_chunk_coords(params);
        let summary = generate_chunk_set_from_params(
            ctx,
            region_id,
            dimension_id,
            params,
            &seed_coords,
            true,
        )?;
        enqueue_non_seed_world_chunks(ctx, region_id, dimension_id, params, &seed_coords);
        return Ok(summary);
    }

    let all_coords = world_chunk_coords(params);
    generate_chunk_set_from_params(ctx, region_id, dimension_id, params, &all_coords, true)
}

pub fn regenerate_chunk_range(
    ctx: &ReducerContext,
    region_id: u64,
    from_chunk_x: i32,
    to_chunk_x: i32,
    from_chunk_y: i32,
    to_chunk_y: i32,
) -> Result<GenerateSummary, String> {
    regenerate_chunk_range_in_dimension(
        ctx,
        region_id,
        DEFAULT_WORLD_DIMENSION_ID,
        from_chunk_x,
        to_chunk_x,
        from_chunk_y,
        to_chunk_y,
    )
}

pub fn regenerate_chunk_range_in_dimension(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    from_chunk_x: i32,
    to_chunk_x: i32,
    from_chunk_y: i32,
    to_chunk_y: i32,
) -> Result<GenerateSummary, String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }
    if from_chunk_x > to_chunk_x || from_chunk_y > to_chunk_y {
        return Err("invalid chunk range: min must be <= max".to_string());
    }

    ensure_default_worldgen_config(ctx);
    let params = load_worldgen_params(ctx);
    validate_params(&params)?;
    ensure_region_exists(ctx, region_id);

    delete_chunk_range_world_data(
        ctx,
        region_id,
        dimension_id,
        from_chunk_x,
        to_chunk_x,
        from_chunk_y,
        to_chunk_y,
    );

    let mut coords = Vec::new();
    for chunk_y in from_chunk_y..=to_chunk_y {
        for chunk_x in from_chunk_x..=to_chunk_x {
            coords.push((chunk_x, chunk_y));
        }
    }
    generate_chunk_set_from_params(ctx, region_id, dimension_id, &params, &coords, true)
}

pub fn request_chunks_for_aoi(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    min_chunk_x: i32,
    max_chunk_x: i32,
    min_chunk_y: i32,
    max_chunk_y: i32,
) -> Result<u32, String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }
    if min_chunk_x > max_chunk_x || min_chunk_y > max_chunk_y {
        return Err("invalid chunk bounds: min must be <= max".to_string());
    }

    ensure_default_worldgen_config(ctx);
    let params = load_worldgen_params(ctx);
    validate_params(&params)?;
    ensure_region_exists(ctx, region_id);

    let ring = if params.lazy_generation_enabled {
        i32::from(params.lazy_prefetch_ring.max(0))
    } else {
        0
    };
    let ext_min_x = min_chunk_x.saturating_sub(ring);
    let ext_max_x = max_chunk_x.saturating_add(ring);
    let ext_min_y = min_chunk_y.saturating_sub(ring);
    let ext_max_y = max_chunk_y.saturating_add(ring);
    let center_x = (min_chunk_x + max_chunk_x) / 2;
    let center_y = (min_chunk_y + max_chunk_y) / 2;

    let mut enqueue_count = 0_u32;
    let mut missing_coords = Vec::<(i32, i32)>::new();

    for chunk_y in ext_min_y..=ext_max_y {
        for chunk_x in ext_min_x..=ext_max_x {
            if !is_chunk_in_world_bounds(&params, chunk_x, chunk_y) {
                continue;
            }
            if has_chunk(ctx, region_id, dimension_id, chunk_x, chunk_y) {
                continue;
            }

            let priority = chunk_x
                .saturating_sub(center_x)
                .abs()
                .saturating_add(chunk_y.saturating_sub(center_y).abs());

            if params.lazy_generation_enabled {
                if enqueue_chunk_generation(
                    ctx,
                    region_id,
                    dimension_id,
                    chunk_x,
                    chunk_y,
                    priority,
                ) {
                    enqueue_count = enqueue_count.saturating_add(1);
                }
            } else {
                missing_coords.push((chunk_x, chunk_y));
            }
        }
    }

    if !params.lazy_generation_enabled && !missing_coords.is_empty() {
        let summary = generate_chunk_set_from_params(
            ctx,
            region_id,
            dimension_id,
            &params,
            &missing_coords,
            false,
        )?;
        enqueue_count = summary.chunk_count;
    }

    Ok(enqueue_count)
}

pub fn drain_chunk_generation_queue(ctx: &ReducerContext) -> Result<GenerateSummary, String> {
    ensure_default_worldgen_config(ctx);
    let params = load_worldgen_params(ctx);
    validate_params(&params)?;

    if !params.enabled || !params.lazy_generation_enabled {
        return Ok(GenerateSummary::default());
    }

    let limit = usize::from(params.lazy_chunks_per_tick.max(1));
    drain_chunk_generation_queue_with_limit(ctx, limit)
}

fn default_worldgen_params(ctx: &ReducerContext) -> WorldGenParams {
    WorldGenParams {
        id: WORLD_GEN_PARAMS_ID,
        enabled: true,
        version: WORLD_GEN_VERSION_V1,
        seed: 1_337,
        size_x_chunks: 7,
        size_y_chunks: 7,
        sea_level: 12,
        noise_scale: DEFAULT_NOISE_SCALE,
        noise_octaves: DEFAULT_NOISE_OCTAVES,
        noise_persistence: DEFAULT_NOISE_PERSISTENCE,
        noise_lacunarity: DEFAULT_NOISE_LACUNARITY,
        terrain_chunk_size: DEFAULT_WORLD_CHUNK_SIZE,
        regenerate_on_start: false,
        lazy_generation_enabled: false,
        lazy_seed_radius_chunks: DEFAULT_LAZY_SEED_RADIUS_CHUNKS,
        lazy_chunks_per_tick: DEFAULT_LAZY_CHUNKS_PER_TICK,
        lazy_prefetch_ring: DEFAULT_LAZY_PREFETCH_RING,
        updated_at: ctx.timestamp,
    }
}

fn validate_params(params: &WorldGenParams) -> Result<(), String> {
    if params.size_x_chunks <= 0 || params.size_y_chunks <= 0 {
        return Err("size_x_chunks and size_y_chunks must be > 0".to_string());
    }
    if params.size_x_chunks > 256 || params.size_y_chunks > 256 {
        return Err("size_x_chunks and size_y_chunks must be <= 256".to_string());
    }
    if params.terrain_chunk_size == 0 {
        return Err("terrain_chunk_size must be > 0".to_string());
    }
    if params.noise_scale <= 0.0 {
        return Err("noise_scale must be > 0".to_string());
    }
    if params.noise_octaves == 0 {
        return Err("noise_octaves must be > 0".to_string());
    }
    if !(0.0..=1.0).contains(&params.noise_persistence) {
        return Err("noise_persistence must be in [0, 1]".to_string());
    }
    if params.noise_lacunarity < 1.0 {
        return Err("noise_lacunarity must be >= 1".to_string());
    }
    if params.lazy_seed_radius_chunks < 0 || params.lazy_seed_radius_chunks > 16 {
        return Err("lazy_seed_radius_chunks must be in [0, 16]".to_string());
    }
    if params.lazy_chunks_per_tick == 0 || params.lazy_chunks_per_tick > 128 {
        return Err("lazy_chunks_per_tick must be in [1, 128]".to_string());
    }
    if params.lazy_prefetch_ring < 0 || params.lazy_prefetch_ring > 4 {
        return Err("lazy_prefetch_ring must be in [0, 4]".to_string());
    }
    Ok(())
}

fn ensure_region_exists(ctx: &ReducerContext, region_id: u64) {
    if ctx.db.region_state().region_id().find(region_id).is_some() {
        return;
    }
    ctx.db.region_state().insert(RegionState {
        region_id,
        name: format!("region-{region_id}"),
        status: DEFAULT_REGION_STATUS,
        shard_load_permille: DEFAULT_REGION_SHARD_LOAD_PERMILLE,
    });
}

fn delete_region_world_data(ctx: &ReducerContext, region_id: u64, dimension_id: u32) {
    let terrain_keys: Vec<String> = ctx
        .db
        .terrain_chunk()
        .iter()
        .filter(|chunk| chunk.region_id == region_id && chunk.dimension_id == dimension_id)
        .map(|chunk| chunk.chunk_key)
        .collect();
    for key in terrain_keys {
        ctx.db.terrain_chunk().chunk_key().delete(key);
    }

    let stream_keys: Vec<String> = ctx
        .db
        .terrain_chunk_stream()
        .iter()
        .filter(|chunk| chunk.region_id == region_id && chunk.dimension_id == dimension_id)
        .map(|chunk| chunk.chunk_key)
        .collect();
    for key in stream_keys {
        ctx.db.terrain_chunk_stream().chunk_key().delete(key);
    }

    let payload_keys: Vec<String> = ctx
        .db
        .terrain_chunk_payload()
        .iter()
        .filter(|chunk| chunk.region_id == region_id && chunk.dimension_id == dimension_id)
        .map(|chunk| chunk.chunk_key)
        .collect();
    for key in payload_keys {
        ctx.db.terrain_chunk_payload().chunk_key().delete(key);
    }

    let resource_ids: Vec<u64> = ctx
        .db
        .resource_node()
        .iter()
        .filter(|node| node.region_id == region_id && node.dimension_id == dimension_id)
        .map(|node| node.entity_id)
        .collect();
    for entity_id in resource_ids {
        ctx.db.resource_node().entity_id().delete(entity_id);
    }

    clear_chunk_generation_queue_for_region_dimension(ctx, region_id, dimension_id);
}

fn delete_chunk_range_world_data(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    from_chunk_x: i32,
    to_chunk_x: i32,
    from_chunk_y: i32,
    to_chunk_y: i32,
) {
    let terrain_keys: Vec<String> = ctx
        .db
        .terrain_chunk()
        .iter()
        .filter(|chunk| {
            chunk.region_id == region_id
                && chunk.dimension_id == dimension_id
                && chunk.chunk_x >= from_chunk_x
                && chunk.chunk_x <= to_chunk_x
                && chunk.chunk_y >= from_chunk_y
                && chunk.chunk_y <= to_chunk_y
        })
        .map(|chunk| chunk.chunk_key)
        .collect();
    for key in terrain_keys {
        ctx.db.terrain_chunk().chunk_key().delete(key);
    }

    let stream_keys: Vec<String> = ctx
        .db
        .terrain_chunk_stream()
        .iter()
        .filter(|chunk| {
            chunk.region_id == region_id
                && chunk.dimension_id == dimension_id
                && chunk.chunk_x >= from_chunk_x
                && chunk.chunk_x <= to_chunk_x
                && chunk.chunk_y >= from_chunk_y
                && chunk.chunk_y <= to_chunk_y
        })
        .map(|chunk| chunk.chunk_key)
        .collect();
    for key in stream_keys {
        ctx.db.terrain_chunk_stream().chunk_key().delete(key);
    }

    let payload_keys: Vec<String> = ctx
        .db
        .terrain_chunk_payload()
        .iter()
        .filter(|chunk| {
            chunk.region_id == region_id
                && chunk.dimension_id == dimension_id
                && chunk.chunk_x >= from_chunk_x
                && chunk.chunk_x <= to_chunk_x
                && chunk.chunk_y >= from_chunk_y
                && chunk.chunk_y <= to_chunk_y
        })
        .map(|chunk| chunk.chunk_key)
        .collect();
    for key in payload_keys {
        ctx.db.terrain_chunk_payload().chunk_key().delete(key);
    }

    let resource_ids: Vec<u64> = ctx
        .db
        .resource_node()
        .iter()
        .filter(|node| {
            node.region_id == region_id
                && node.dimension_id == dimension_id
                && node.chunk_x >= from_chunk_x
                && node.chunk_x <= to_chunk_x
                && node.chunk_y >= from_chunk_y
                && node.chunk_y <= to_chunk_y
        })
        .map(|node| node.entity_id)
        .collect();
    for entity_id in resource_ids {
        ctx.db.resource_node().entity_id().delete(entity_id);
    }

    let queue_keys: Vec<String> = ctx
        .db
        .worldgen_chunk_generation_queue()
        .iter()
        .filter(|row| {
            row.region_id == region_id
                && row.dimension_id == dimension_id
                && row.chunk_x >= from_chunk_x
                && row.chunk_x <= to_chunk_x
                && row.chunk_y >= from_chunk_y
                && row.chunk_y <= to_chunk_y
        })
        .map(|row| row.queue_key)
        .collect();
    for key in queue_keys {
        ctx.db
            .worldgen_chunk_generation_queue()
            .queue_key()
            .delete(key);
    }
}

fn clear_chunk_generation_queue_for_region_dimension(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
) {
    let keys: Vec<String> = ctx
        .db
        .worldgen_chunk_generation_queue()
        .iter()
        .filter(|row| row.region_id == region_id && row.dimension_id == dimension_id)
        .map(|row| row.queue_key)
        .collect();
    for key in keys {
        ctx.db
            .worldgen_chunk_generation_queue()
            .queue_key()
            .delete(key);
    }
}

fn has_chunk(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
) -> bool {
    ctx.db
        .terrain_chunk()
        .chunk_key()
        .find(chunk_key(region_id, dimension_id, chunk_x, chunk_y))
        .is_some()
}

fn enqueue_chunk_generation(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
    priority: i32,
) -> bool {
    if has_chunk(ctx, region_id, dimension_id, chunk_x, chunk_y) {
        return false;
    }

    let queue_key = chunk_key(region_id, dimension_id, chunk_x, chunk_y);
    if let Some(mut row) = ctx
        .db
        .worldgen_chunk_generation_queue()
        .queue_key()
        .find(queue_key.clone())
    {
        if priority < row.priority {
            row.priority = priority;
            row.requested_at = ctx.timestamp;
            ctx.db.worldgen_chunk_generation_queue().queue_key().update(row);
        }
        return false;
    }

    ctx.db
        .worldgen_chunk_generation_queue()
        .insert(WorldgenChunkGenerationQueue {
            queue_key,
            region_id,
            dimension_id,
            chunk_x,
            chunk_y,
            priority,
            requested_at: ctx.timestamp,
        });
    true
}

fn world_chunk_coords(params: &WorldGenParams) -> Vec<(i32, i32)> {
    let x_start = -(params.size_x_chunks / 2);
    let y_start = -(params.size_y_chunks / 2);
    let mut coords = Vec::with_capacity(
        usize::try_from(params.size_x_chunks.saturating_mul(params.size_y_chunks)).unwrap_or(0),
    );
    for y_off in 0..params.size_y_chunks {
        for x_off in 0..params.size_x_chunks {
            coords.push((x_start + x_off, y_start + y_off));
        }
    }
    coords
}

fn seed_chunk_coords(params: &WorldGenParams) -> Vec<(i32, i32)> {
    let radius = i32::from(params.lazy_seed_radius_chunks.max(0));
    let mut coords = Vec::new();
    for y in -radius..=radius {
        for x in -radius..=radius {
            if is_chunk_in_world_bounds(params, x, y) {
                coords.push((x, y));
            }
        }
    }
    coords.sort_by_key(|(x, y)| (*y, *x));
    coords.dedup();
    coords
}

fn is_chunk_in_world_bounds(params: &WorldGenParams, chunk_x: i32, chunk_y: i32) -> bool {
    let x_start = -(params.size_x_chunks / 2);
    let y_start = -(params.size_y_chunks / 2);
    let x_end = x_start + params.size_x_chunks - 1;
    let y_end = y_start + params.size_y_chunks - 1;
    chunk_x >= x_start && chunk_x <= x_end && chunk_y >= y_start && chunk_y <= y_end
}

fn enqueue_world_seed_window(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    params: &WorldGenParams,
) {
    let seed = seed_chunk_coords(params);
    enqueue_non_seed_world_chunks(ctx, region_id, dimension_id, params, &seed);
}

fn enqueue_non_seed_world_chunks(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    params: &WorldGenParams,
    seed_coords: &[(i32, i32)],
) {
    let seed_set = seed_coords.iter().copied().collect::<HashSet<_>>();
    for (chunk_x, chunk_y) in world_chunk_coords(params) {
        if seed_set.contains(&(chunk_x, chunk_y)) {
            continue;
        }
        let priority = chunk_x.abs().saturating_add(chunk_y.abs());
        enqueue_chunk_generation(ctx, region_id, dimension_id, chunk_x, chunk_y, priority);
    }
}

fn generate_chunk_set_from_params(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    params: &WorldGenParams,
    chunk_coords: &[(i32, i32)],
    overwrite_existing: bool,
) -> Result<GenerateSummary, String> {
    if chunk_coords.is_empty() {
        return Ok(GenerateSummary::default());
    }
    let config = load_generation_config(ctx, params)?;
    generate_chunk_set_with_config(
        ctx,
        region_id,
        dimension_id,
        &config,
        chunk_coords,
        overwrite_existing,
    )
}

fn generate_chunk_set_with_config(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    config: &GenerationConfig,
    chunk_coords: &[(i32, i32)],
    overwrite_existing: bool,
) -> Result<GenerateSummary, String> {
    if chunk_coords.is_empty() {
        return Ok(GenerateSummary::default());
    }

    let mut unique = chunk_coords.to_vec();
    unique.sort_by_key(|(x, y)| (*y, *x));
    unique.dedup();

    let chunk_size = i32::from(config.params.terrain_chunk_size);
    let cache = build_region_hydro_cache(&unique, chunk_size, &config.params)?;
    let mut summary = GenerateSummary::default();

    for (chunk_x, chunk_y) in unique {
        if !overwrite_existing && has_chunk(ctx, region_id, dimension_id, chunk_x, chunk_y) {
            continue;
        }

        let Some(indices) = cache.indices_by_chunk.get(&(chunk_x, chunk_y)) else {
            continue;
        };
        let build = build_chunk_from_cache(
            ctx,
            region_id,
            dimension_id,
            chunk_x,
            chunk_y,
            indices,
            &cache,
            config,
        )?;
        upsert_chunk(ctx, build.chunk);
        upsert_chunk_stream(ctx, build.chunk_stream);
        upsert_chunk_payload(ctx, build.chunk_payload);
        for resource in build.resources {
            upsert_resource(ctx, resource);
            summary.resource_count = summary.resource_count.saturating_add(1);
        }
        summary.chunk_count = summary.chunk_count.saturating_add(1);
    }

    Ok(summary)
}

fn drain_chunk_generation_queue_with_limit(
    ctx: &ReducerContext,
    limit: usize,
) -> Result<GenerateSummary, String> {
    if limit == 0 {
        return Ok(GenerateSummary::default());
    }

    let mut rows: Vec<WorldgenChunkGenerationQueue> =
        ctx.db.worldgen_chunk_generation_queue().iter().collect();
    rows.sort_by(|a, b| {
        let a_ts = a.requested_at.to_micros_since_unix_epoch();
        let b_ts = b.requested_at.to_micros_since_unix_epoch();
        a.priority
            .cmp(&b.priority)
            .then_with(|| a_ts.cmp(&b_ts))
            .then_with(|| a.queue_key.cmp(&b.queue_key))
    });

    if rows.is_empty() {
        return Ok(GenerateSummary::default());
    }

    let selected = rows.into_iter().take(limit).collect::<Vec<_>>();
    let mut grouped = HashMap::<(u64, u32), Vec<(i32, i32)>>::new();
    let mut keys_to_delete = Vec::<String>::new();

    for row in selected {
        if has_chunk(ctx, row.region_id, row.dimension_id, row.chunk_x, row.chunk_y) {
            keys_to_delete.push(row.queue_key);
            continue;
        }
        grouped
            .entry((row.region_id, row.dimension_id))
            .or_default()
            .push((row.chunk_x, row.chunk_y));
        keys_to_delete.push(row.queue_key);
    }

    let params = load_worldgen_params(ctx);
    let mut summary = GenerateSummary::default();
    for ((region_id, dimension_id), coords) in grouped {
        ensure_region_exists(ctx, region_id);
        let chunk_summary = generate_chunk_set_from_params(
            ctx,
            region_id,
            dimension_id,
            &params,
            &coords,
            false,
        )?;
        summary.chunk_count = summary.chunk_count.saturating_add(chunk_summary.chunk_count);
        summary.resource_count = summary
            .resource_count
            .saturating_add(chunk_summary.resource_count);
    }

    for key in keys_to_delete {
        ctx.db
            .worldgen_chunk_generation_queue()
            .queue_key()
            .delete(key);
    }

    Ok(summary)
}

fn upsert_chunk(ctx: &ReducerContext, chunk: TerrainChunk) {
    let key = chunk.chunk_key.clone();
    if ctx.db.terrain_chunk().chunk_key().find(key).is_some() {
        ctx.db.terrain_chunk().chunk_key().update(chunk);
    } else {
        ctx.db.terrain_chunk().insert(chunk);
    }
}

fn upsert_chunk_stream(ctx: &ReducerContext, chunk: TerrainChunkStream) {
    let key = chunk.chunk_key.clone();
    if ctx
        .db
        .terrain_chunk_stream()
        .chunk_key()
        .find(key)
        .is_some()
    {
        ctx.db.terrain_chunk_stream().chunk_key().update(chunk);
    } else {
        ctx.db.terrain_chunk_stream().insert(chunk);
    }
}

fn upsert_chunk_payload(ctx: &ReducerContext, chunk: TerrainChunkPayload) {
    let key = chunk.chunk_key.clone();
    if ctx
        .db
        .terrain_chunk_payload()
        .chunk_key()
        .find(key)
        .is_some()
    {
        ctx.db.terrain_chunk_payload().chunk_key().update(chunk);
    } else {
        ctx.db.terrain_chunk_payload().insert(chunk);
    }
}

fn backfill_chunk_stream_from_chunks(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
) -> u32 {
    let chunks: Vec<TerrainChunk> = ctx
        .db
        .terrain_chunk()
        .iter()
        .filter(|chunk| chunk.region_id == region_id && chunk.dimension_id == dimension_id)
        .collect();

    let mut inserted = 0_u32;
    for chunk in chunks {
        if ctx
            .db
            .terrain_chunk_stream()
            .chunk_key()
            .find(chunk.chunk_key.clone())
            .is_some()
        {
            continue;
        }

        ctx.db.terrain_chunk_stream().insert(TerrainChunkStream {
            chunk_key: chunk.chunk_key,
            region_id: chunk.region_id,
            dimension_id: chunk.dimension_id,
            chunk_x: chunk.chunk_x,
            chunk_y: chunk.chunk_y,
            biome_id: chunk.biome_id,
            seed: chunk.seed,
            generated_at: chunk.generated_at,
            height_min: chunk.height_min,
            height_max: chunk.height_max,
            water_ratio_permille: chunk.water_ratio_permille,
        });
        inserted = inserted.saturating_add(1);
    }

    inserted
}

fn backfill_chunk_payload_from_chunks(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
) -> u32 {
    let chunks: Vec<TerrainChunk> = ctx
        .db
        .terrain_chunk()
        .iter()
        .filter(|chunk| chunk.region_id == region_id && chunk.dimension_id == dimension_id)
        .collect();

    let mut inserted = 0_u32;
    for chunk in chunks {
        if ctx
            .db
            .terrain_chunk_payload()
            .chunk_key()
            .find(chunk.chunk_key.clone())
            .is_some()
        {
            continue;
        }

        let fields_per_cell = if chunk.cell_payload_version == CELL_PAYLOAD_VERSION_V2 {
            CELL_PAYLOAD_FIELDS_V2
        } else {
            CELL_PAYLOAD_FIELDS_V1
        };
        let cell_count = if fields_per_cell > 0 {
            u32::try_from(chunk.cell_payload.len() / fields_per_cell).unwrap_or(0)
        } else {
            0
        };
        let bytes =
            encode_cell_payload_i16_to_bytes(&chunk.cell_payload, chunk.cell_payload_version);
        ctx.db.terrain_chunk_payload().insert(TerrainChunkPayload {
            chunk_key: chunk.chunk_key,
            region_id: chunk.region_id,
            dimension_id: chunk.dimension_id,
            chunk_x: chunk.chunk_x,
            chunk_y: chunk.chunk_y,
            cell_payload_version: chunk.cell_payload_version,
            cell_payload_bytes: bytes,
            cell_count,
            generated_at: chunk.generated_at,
        });
        inserted = inserted.saturating_add(1);
    }

    inserted
}

fn upsert_resource(ctx: &ReducerContext, node: ResourceNode) {
    if ctx
        .db
        .resource_node()
        .entity_id()
        .find(node.entity_id)
        .is_some()
    {
        ctx.db.resource_node().entity_id().update(node);
    } else {
        ctx.db.resource_node().insert(node);
    }
}

fn load_generation_config(
    ctx: &ReducerContext,
    params: &WorldGenParams,
) -> Result<GenerationConfig, String> {
    let mut biome_defs: Vec<BiomeGenDef> = ctx.db.biome_gen_def().iter().collect();
    biome_defs.sort_by_key(|item| item.biome_id);
    if biome_defs.is_empty() {
        return Err("biome_gen_def is empty".to_string());
    }

    let mut resource_defs: Vec<ResourceGenDef> = ctx.db.resource_gen_def().iter().collect();
    resource_defs.sort_by_key(|item| item.resource_type);

    let mut clump_members: Vec<ResourceClumpDef> = ctx.db.resource_clump_def().iter().collect();
    clump_members.sort_by_key(|item| (item.resource_type, item.clump_id, item.member_index));
    let mut clumps_by_resource = HashMap::<u8, Vec<ClumpTemplate>>::new();
    let mut grouped = HashMap::<(u8, i32), Vec<ClumpMember>>::new();
    for row in clump_members {
        grouped
            .entry((row.resource_type, row.clump_id))
            .or_default()
            .push(ClumpMember {
                member_index: row.member_index,
                dx: row.dx,
                dz: row.dz,
                is_center: row.is_center,
            });
    }
    for ((resource_type, clump_id), mut members) in grouped {
        members.sort_by_key(|member| member.member_index);
        clumps_by_resource
            .entry(resource_type)
            .or_default()
            .push(ClumpTemplate { clump_id, members });
    }

    for templates in clumps_by_resource.values_mut() {
        templates.sort_by_key(|item| item.clump_id);
    }

    Ok(GenerationConfig {
        params: WorldGenParams {
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
            lazy_generation_enabled: params.lazy_generation_enabled,
            lazy_seed_radius_chunks: params.lazy_seed_radius_chunks,
            lazy_chunks_per_tick: params.lazy_chunks_per_tick,
            lazy_prefetch_ring: params.lazy_prefetch_ring,
            updated_at: params.updated_at,
        },
        biome_defs,
        resource_defs,
        clumps_by_resource,
    })
}

#[allow(dead_code)]
fn build_chunk(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
    chunk_size: i32,
    config: &GenerationConfig,
) -> Result<ChunkBuild, String> {
    let cache = build_region_hydro_cache(&[(chunk_x, chunk_y)], chunk_size, &config.params)?;
    let indices = cache
        .indices_by_chunk
        .get(&(chunk_x, chunk_y))
        .ok_or_else(|| format!("missing cache indices for chunk ({chunk_x}, {chunk_y})"))?;
    build_chunk_from_cache(
        ctx,
        region_id,
        dimension_id,
        chunk_x,
        chunk_y,
        indices,
        &cache,
        config,
    )
}

fn build_chunk_from_cache(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
    indices: &[usize],
    cache: &RegionHydroCache,
    config: &GenerationConfig,
) -> Result<ChunkBuild, String> {
    if indices.is_empty() {
        return Err("chunk cache has no cells".to_string());
    }

    let mut cells = Vec::<TerrainCellSample>::with_capacity(indices.len());
    let mut coords = Vec::<CellCoord>::with_capacity(indices.len());
    let mut biome_counts = HashMap::<u16, u32>::new();
    let mut water_count = 0_u32;
    let mut height_min = i16::MAX;
    let mut height_max = i16::MIN;

    for &index in indices {
        let cell = cache.cells[index];
        let coord = cache.coords[index];
        if cell.water_level > cell.elevation {
            water_count = water_count.saturating_add(1);
        }
        height_min = height_min.min(cell.elevation);
        height_max = height_max.max(cell.elevation);
        *biome_counts.entry(cell.biome_id).or_insert(0) += 1;
        cells.push(cell);
        coords.push(coord);
    }

    let biome_id = biome_counts
        .into_iter()
        .max_by_key(|(_, count)| *count)
        .map(|(biome, _)| biome)
        .unwrap_or(0);
    let total_cells = u32::try_from(indices.len()).map_err(|_| "cell count overflow".to_string())?;
    let water_ratio_permille =
        (((water_count as f64 / total_cells as f64) * 1000.0).round() as i64).clamp(0, 1000) as u16;

    let mut cell_payload = Vec::<i16>::with_capacity(indices.len() * CELL_PAYLOAD_FIELDS_V2);
    for cell in &cells {
        let flags = pack_cell_flags(cell);
        cell_payload.push(cell.elevation);
        cell_payload.push(cell.water_level);
        cell_payload.push(i16::try_from(cell.biome_id).unwrap_or(i16::MAX));
        cell_payload.push(flags);
        cell_payload.push(i16::from(cell.water_body_type));
        cell_payload.push(cell.distance_to_water_proxy);
        cell_payload.push(cell.distance_to_sea_proxy);
        cell_payload.push(cell.river_flow_permille);
    }
    let cell_payload_version = CELL_PAYLOAD_VERSION_V2;
    let cell_payload_bytes = pack_chunk_payload(&cell_payload);

    let chunk = TerrainChunk {
        chunk_key: chunk_key(region_id, dimension_id, chunk_x, chunk_y),
        region_id,
        dimension_id,
        chunk_x,
        chunk_y,
        biome_id,
        seed: config.params.seed,
        generated_at: ctx.timestamp,
        height_min,
        height_max,
        water_ratio_permille,
        cell_payload_version,
        cell_payload,
    };
    let chunk_stream = TerrainChunkStream {
        chunk_key: chunk.chunk_key.clone(),
        region_id: chunk.region_id,
        dimension_id: chunk.dimension_id,
        chunk_x: chunk.chunk_x,
        chunk_y: chunk.chunk_y,
        biome_id: chunk.biome_id,
        seed: chunk.seed,
        generated_at: chunk.generated_at,
        height_min: chunk.height_min,
        height_max: chunk.height_max,
        water_ratio_permille: chunk.water_ratio_permille,
    };
    let chunk_payload = TerrainChunkPayload {
        chunk_key: chunk.chunk_key.clone(),
        region_id: chunk.region_id,
        dimension_id: chunk.dimension_id,
        chunk_x: chunk.chunk_x,
        chunk_y: chunk.chunk_y,
        cell_payload_version,
        cell_payload_bytes,
        cell_count: total_cells,
        generated_at: chunk.generated_at,
    };
    let resources = build_chunk_resources(
        ctx,
        region_id,
        dimension_id,
        chunk_x,
        chunk_y,
        &cells,
        &coords,
        config,
    )?;

    Ok(ChunkBuild {
        chunk,
        chunk_stream,
        chunk_payload,
        resources,
    })
}

fn build_region_hydro_cache(
    chunk_coords: &[(i32, i32)],
    chunk_size: i32,
    params: &WorldGenParams,
) -> Result<RegionHydroCache, String> {
    let chunk_size_usize =
        usize::try_from(chunk_size).map_err(|_| "chunk_size overflow".to_string())?;
    if chunk_size_usize == 0 {
        return Err("chunk_size must be > 0".to_string());
    }

    let mut sorted = chunk_coords.to_vec();
    sorted.sort_by_key(|(x, y)| (*y, *x));
    sorted.dedup();

    let mut cells = Vec::<TerrainCellSample>::new();
    let mut coords = Vec::<CellCoord>::new();
    let mut indices_by_chunk = HashMap::<(i32, i32), Vec<usize>>::new();
    let mut index_by_hex = HashMap::<(i32, i32), usize>::new();

    for (chunk_x, chunk_y) in sorted {
        let mut chunk_indices = Vec::<usize>::with_capacity(chunk_size_usize * chunk_size_usize);
        for local_z in 0..chunk_size_usize {
            for local_x in 0..chunk_size_usize {
                let lx = i32::try_from(local_x).map_err(|_| "local_x overflow".to_string())?;
                let lz = i32::try_from(local_z).map_err(|_| "local_z overflow".to_string())?;
                let hex_x = chunk_x.saturating_mul(chunk_size).saturating_add(lx);
                let hex_z = chunk_y.saturating_mul(chunk_size).saturating_add(lz);
                let index = cells.len();
                cells.push(sample_terrain_cell(hex_x, hex_z, params));
                coords.push(CellCoord {
                    local_x,
                    local_z,
                    hex_x,
                    hex_z,
                });
                index_by_hex.insert((hex_x, hex_z), index);
                chunk_indices.push(index);
            }
        }
        indices_by_chunk.insert((chunk_x, chunk_y), chunk_indices);
    }

    for cell in &mut cells {
        cell.river_flow_permille = 0;
        if cell.elevation < params.sea_level {
            cell.water_level = cell.water_level.max(params.sea_level);
            cell.water_body_type = 1;
            continue;
        }
        if cell.water_level > cell.elevation {
            cell.water_body_type = 2;
        } else {
            cell.water_body_type = 0;
            cell.water_level = cell.water_level.max(cell.elevation);
        }
    }

    let mut lakes = detect_lake_bodies(&mut cells, &coords, &index_by_hex, params.sea_level);
    flatten_lake_bodies(&mut cells, &mut lakes, params.sea_level);
    let rivers = build_river_paths_mst(&cells, &coords, &index_by_hex, &lakes);
    apply_river_paths(&mut cells, &rivers);
    compute_distance_field_proxies(&mut cells, &coords, &index_by_hex);
    apply_biome_post_hydrology(&mut cells);

    Ok(RegionHydroCache {
        cells,
        coords,
        indices_by_chunk,
    })
}

fn pack_cell_flags(cell: &TerrainCellSample) -> i16 {
    let mut flags = 0_i16;
    if cell.water_level > cell.elevation {
        flags |= 0b0000_0000_0000_0001;
    }
    if cell.water_body_type == 3 {
        flags |= 0b0000_0000_0000_0010;
    }
    if cell.water_body_type == 2 {
        flags |= 0b0000_0000_0000_0100;
    }
    if cell.water_body_type == 1 {
        flags |= 0b0000_0000_0000_1000;
    }
    flags
}

fn detect_lake_bodies(
    cells: &mut [TerrainCellSample],
    coords: &[CellCoord],
    index_by_hex: &HashMap<(i32, i32), usize>,
    sea_level: i16,
) -> Vec<LakeBody> {
    let mut visited = vec![false; cells.len()];
    let mut lakes = Vec::<LakeBody>::new();

    for start in 0..cells.len() {
        if visited[start] || cells[start].water_body_type != 2 {
            continue;
        }

        let mut component = Vec::<usize>::new();
        let mut stack = vec![start];
        visited[start] = true;
        while let Some(index) = stack.pop() {
            component.push(index);
            let coord = coords[index];
            for (dx, dz) in [(1_i32, 0_i32), (-1, 0), (0, 1), (0, -1)] {
                let next = (coord.hex_x + dx, coord.hex_z + dz);
                let Some(&nidx) = index_by_hex.get(&next) else {
                    continue;
                };
                if visited[nidx] || cells[nidx].water_body_type != 2 {
                    continue;
                }
                visited[nidx] = true;
                stack.push(nidx);
            }
        }

        if component.len() < MIN_LAKE_SIZE_CELLS {
            for index in component {
                cells[index].water_body_type = 0;
                cells[index].water_level = cells[index].elevation;
            }
            continue;
        }

        let mut shore_cells = Vec::<usize>::new();
        let mut center_x_sum = 0_i64;
        let mut center_z_sum = 0_i64;
        for &index in &component {
            let coord = coords[index];
            center_x_sum += i64::from(coord.hex_x);
            center_z_sum += i64::from(coord.hex_z);

            let mut is_shore = false;
            for (dx, dz) in [(1_i32, 0_i32), (-1, 0), (0, 1), (0, -1)] {
                let next = (coord.hex_x + dx, coord.hex_z + dz);
                match index_by_hex.get(&next) {
                    Some(&nidx) if cells[nidx].water_body_type == 2 => {}
                    _ => {
                        is_shore = true;
                        break;
                    }
                }
            }
            if is_shore {
                shore_cells.push(index);
            }
        }

        let len_i64 = i64::try_from(component.len()).unwrap_or(1).max(1);
        let center_x = center_x_sum / len_i64;
        let center_z = center_z_sum / len_i64;
        let center_index = component
            .iter()
            .copied()
            .min_by_key(|index| {
                let coord = coords[*index];
                (i64::from(coord.hex_x) - center_x).abs()
                    + (i64::from(coord.hex_z) - center_z).abs()
            })
            .unwrap_or(component[0]);

        lakes.push(LakeBody {
            id: lakes.len(),
            cells: component,
            shore_cells,
            center_index,
            surface_level: sea_level,
        });
    }

    lakes
}

fn flatten_lake_bodies(cells: &mut [TerrainCellSample], lakes: &mut [LakeBody], sea_level: i16) {
    for lake in lakes.iter_mut() {
        let mut levels = lake
            .cells
            .iter()
            .map(|index| cells[*index].water_level)
            .collect::<Vec<_>>();
        levels.sort_unstable();
        let p75 = levels.get((levels.len() * 3) / 4).copied().unwrap_or(sea_level);
        let surface = p75.max(sea_level);
        lake.surface_level = surface;

        for index in &lake.cells {
            let idx = *index;
            let floor = surface.saturating_sub(LAKE_DEPTH_MAX);
            cells[idx].elevation = cells[idx].elevation.min(floor);
            cells[idx].water_level = surface.max(cells[idx].elevation.saturating_add(1));
            cells[idx].water_body_type = 2;
            cells[idx].river_flow_permille = 0;
        }
    }
}

fn build_river_paths_mst(
    cells: &[TerrainCellSample],
    coords: &[CellCoord],
    index_by_hex: &HashMap<(i32, i32), usize>,
    lakes: &[LakeBody],
) -> Vec<RiverPath> {
    if lakes.len() < 2 {
        return Vec::new();
    }

    let mut candidate_edges = Vec::<(i32, usize, usize)>::new();
    let mut dedupe = HashSet::<(usize, usize)>::new();
    for left in 0..lakes.len() {
        let left_center = coords[lakes[left].center_index];
        let mut nearest = Vec::<(i32, usize)>::new();
        for right in 0..lakes.len() {
            if left == right {
                continue;
            }
            let right_center = coords[lakes[right].center_index];
            let dist = (left_center.hex_x - right_center.hex_x)
                .abs()
                .saturating_add((left_center.hex_z - right_center.hex_z).abs());
            nearest.push((dist, right));
        }
        nearest.sort_by_key(|(dist, _)| *dist);
        for (_, right) in nearest.into_iter().take(RIVER_KNN) {
            let pair = if left < right {
                (left, right)
            } else {
                (right, left)
            };
            if !dedupe.insert(pair) {
                continue;
            }
            let cost = lake_connection_cost(cells, coords, &lakes[pair.0], &lakes[pair.1]);
            candidate_edges.push((cost, pair.0, pair.1));
        }
    }
    candidate_edges.sort_by_key(|(cost, _, _)| *cost);

    let mut parent = (0..lakes.len()).collect::<Vec<_>>();
    let mut rank = vec![0_u8; lakes.len()];
    let mut paths = Vec::<RiverPath>::new();
    for (_, left, right) in candidate_edges {
        if !union_sets(&mut parent, &mut rank, left, right) {
            continue;
        }
        if let Some((path, cost)) = find_river_path_astar(
            lakes[left].center_index,
            lakes[right].center_index,
            cells,
            coords,
            index_by_hex,
        ) {
            paths.push(RiverPath {
                from_lake_id: lakes[left].id,
                to_lake_id: lakes[right].id,
                path,
                cost,
            });
        }
    }

    paths
}

fn apply_river_paths(cells: &mut [TerrainCellSample], river_paths: &[RiverPath]) {
    let mut sorted_paths = river_paths.to_vec();
    sorted_paths.sort_by_key(|path| (path.cost, path.from_lake_id, path.to_lake_id));
    for path in sorted_paths {
        let len = path.path.len().max(1);
        for (step, index) in path.path.into_iter().enumerate() {
            if cells[index].water_body_type == 1 {
                continue;
            }
            if cells[index].water_body_type == 0 {
                cells[index].water_body_type = 3;
            }
            let target_water = cells[index].elevation.saturating_add(RIVER_DEPTH);
            cells[index].water_level = cells[index].water_level.max(target_water);

            let flow = if len <= 1 {
                RIVER_FLOW_MAX
            } else {
                let frac = step as f32 / (len - 1) as f32;
                let span = (RIVER_FLOW_MAX - RIVER_FLOW_MIN) as f32;
                (RIVER_FLOW_MAX as f32 - frac * span).round() as i16
            };
            if cells[index].water_body_type == 3 {
                cells[index].river_flow_permille = cells[index].river_flow_permille.max(flow);
            }
        }
    }
}

fn compute_distance_field_proxies(
    cells: &mut [TerrainCellSample],
    coords: &[CellCoord],
    index_by_hex: &HashMap<(i32, i32), usize>,
) {
    let mut queue_water = VecDeque::<usize>::new();
    let mut queue_sea = VecDeque::<usize>::new();

    for index in 0..cells.len() {
        if cells[index].water_body_type != 0 {
            cells[index].distance_to_water_proxy = 0;
            queue_water.push_back(index);
        } else {
            cells[index].distance_to_water_proxy = i16::MAX;
        }
        if cells[index].water_body_type == 1 {
            cells[index].distance_to_sea_proxy = 0;
            queue_sea.push_back(index);
        } else {
            cells[index].distance_to_sea_proxy = i16::MAX;
        }
    }

    while let Some(index) = queue_water.pop_front() {
        let base = cells[index].distance_to_water_proxy;
        let coord = coords[index];
        for (dx, dz) in [(1_i32, 0_i32), (-1, 0), (0, 1), (0, -1)] {
            let next = (coord.hex_x + dx, coord.hex_z + dz);
            let Some(&nidx) = index_by_hex.get(&next) else {
                continue;
            };
            let candidate = base.saturating_add(1);
            if candidate < cells[nidx].distance_to_water_proxy {
                cells[nidx].distance_to_water_proxy = candidate;
                queue_water.push_back(nidx);
            }
        }
    }

    while let Some(index) = queue_sea.pop_front() {
        let base = cells[index].distance_to_sea_proxy;
        let coord = coords[index];
        for (dx, dz) in [(1_i32, 0_i32), (-1, 0), (0, 1), (0, -1)] {
            let next = (coord.hex_x + dx, coord.hex_z + dz);
            let Some(&nidx) = index_by_hex.get(&next) else {
                continue;
            };
            let candidate = base.saturating_add(1);
            if candidate < cells[nidx].distance_to_sea_proxy {
                cells[nidx].distance_to_sea_proxy = candidate;
                queue_sea.push_back(nidx);
            }
        }
    }

    for cell in cells {
        cell.distance_to_water_proxy = cell.distance_to_water_proxy.clamp(0, i16::MAX);
        cell.distance_to_sea_proxy = cell.distance_to_sea_proxy.clamp(0, i16::MAX);
        if cell.water_body_type != 3 {
            cell.river_flow_permille = 0;
        }
    }
}

fn apply_biome_post_hydrology(cells: &mut [TerrainCellSample]) {
    for cell in cells {
        if cell.water_body_type == 1 {
            cell.biome_id = 5;
            continue;
        }
        if cell.water_body_type == 2 {
            cell.biome_id = 4;
            continue;
        }
        if cell.water_body_type == 3 {
            cell.biome_id = 1;
            continue;
        }

        if cell.distance_to_water_proxy <= 2 {
            cell.moisture = cell.moisture.saturating_add(180).clamp(0, 1000);
            if cell.biome_id == 2 {
                cell.biome_id = 0;
            }
        }

        if cell.moisture < 250 {
            cell.biome_id = 2;
        } else if cell.temperature < 250 {
            cell.biome_id = 3;
        } else if cell.moisture > 650 {
            cell.biome_id = 1;
        } else {
            cell.biome_id = 0;
        }
    }
}

fn lake_connection_cost(
    cells: &[TerrainCellSample],
    coords: &[CellCoord],
    left: &LakeBody,
    right: &LakeBody,
) -> i32 {
    let left_center = coords[left.center_index];
    let right_center = coords[right.center_index];
    let distance = (left_center.hex_x - right_center.hex_x)
        .abs()
        .saturating_add((left_center.hex_z - right_center.hex_z).abs());

    let mut min_shore_distance = distance;
    for &left_idx in &left.shore_cells {
        let lc = coords[left_idx];
        for &right_idx in &right.shore_cells {
            let rc = coords[right_idx];
            let d = (lc.hex_x - rc.hex_x)
                .abs()
                .saturating_add((lc.hex_z - rc.hex_z).abs());
            if d < min_shore_distance {
                min_shore_distance = d;
            }
        }
    }

    let left_elevation = i32::from(cells[left.center_index].elevation);
    let right_elevation = i32::from(cells[right.center_index].elevation);
    let uphill_penalty = (right_elevation - left_elevation).max(0);
    min_shore_distance
        .saturating_mul(10)
        .saturating_add(uphill_penalty.saturating_mul(4))
}

fn find_river_path_astar(
    start: usize,
    goal: usize,
    cells: &[TerrainCellSample],
    coords: &[CellCoord],
    index_by_hex: &HashMap<(i32, i32), usize>,
) -> Option<(Vec<usize>, i32)> {
    use std::cmp::Reverse;
    use std::collections::BinaryHeap;

    if start == goal {
        return Some((vec![start], 0));
    }

    let mut open = BinaryHeap::<(Reverse<i32>, usize)>::new();
    let mut came_from = HashMap::<usize, usize>::new();
    let mut best_cost = HashMap::<usize, i32>::new();

    best_cost.insert(start, 0);
    open.push((Reverse(heuristic(coords, start, goal)), start));

    while let Some((_, current)) = open.pop() {
        if current == goal {
            let mut path = vec![goal];
            let mut cursor = goal;
            while let Some(prev) = came_from.get(&cursor) {
                path.push(*prev);
                cursor = *prev;
            }
            path.reverse();
            let cost = *best_cost.get(&goal).unwrap_or(&0);
            return Some((path, cost));
        }

        let current_cost = *best_cost.get(&current).unwrap_or(&i32::MAX);
        if current_cost == i32::MAX {
            continue;
        }

        let coord = coords[current];
        for (dx, dz) in [(1_i32, 0_i32), (-1, 0), (0, 1), (0, -1)] {
            let next = (coord.hex_x + dx, coord.hex_z + dz);
            let Some(&next_idx) = index_by_hex.get(&next) else {
                continue;
            };
            let step_cost = river_step_cost(cells[current], cells[next_idx]);
            let next_cost = current_cost.saturating_add(step_cost);
            if next_cost >= *best_cost.get(&next_idx).unwrap_or(&i32::MAX) {
                continue;
            }
            came_from.insert(next_idx, current);
            best_cost.insert(next_idx, next_cost);
            let estimate = next_cost.saturating_add(heuristic(coords, next_idx, goal));
            open.push((Reverse(estimate), next_idx));
        }
    }

    None
}

fn river_step_cost(from: TerrainCellSample, to: TerrainCellSample) -> i32 {
    let mut cost = 10_i32;
    let uphill = i32::from(to.elevation.saturating_sub(from.elevation).max(0));
    cost = cost.saturating_add(uphill.saturating_mul(3));
    if to.water_body_type != 0 {
        cost = cost.saturating_sub(3);
    }
    if to.water_body_type == 1 {
        cost = cost.saturating_sub(2);
    }
    cost.max(1)
}

fn heuristic(coords: &[CellCoord], from: usize, to: usize) -> i32 {
    let a = coords[from];
    let b = coords[to];
    (a.hex_x - b.hex_x)
        .abs()
        .saturating_add((a.hex_z - b.hex_z).abs())
        .saturating_mul(4)
}

fn find_root(parent: &mut [usize], node: usize) -> usize {
    if parent[node] != node {
        let root = find_root(parent, parent[node]);
        parent[node] = root;
    }
    parent[node]
}

fn union_sets(parent: &mut [usize], rank: &mut [u8], left: usize, right: usize) -> bool {
    let mut root_left = find_root(parent, left);
    let mut root_right = find_root(parent, right);
    if root_left == root_right {
        return false;
    }
    if rank[root_left] < rank[root_right] {
        std::mem::swap(&mut root_left, &mut root_right);
    }
    parent[root_right] = root_left;
    if rank[root_left] == rank[root_right] {
        rank[root_left] = rank[root_left].saturating_add(1);
    }
    true
}

fn pack_chunk_payload(payload: &[i16]) -> Vec<u8> {
    let mut out = Vec::<u8>::with_capacity(payload.len() * 2);
    for value in payload {
        out.extend_from_slice(&value.to_le_bytes());
    }
    out
}

fn build_chunk_resources(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
    cells: &[TerrainCellSample],
    coords: &[CellCoord],
    config: &GenerationConfig,
) -> Result<Vec<ResourceNode>, String> {
    if config.resource_defs.is_empty() {
        return Ok(Vec::new());
    }

    let chunk_size = usize::from(config.params.terrain_chunk_size);
    let mut occupied = vec![false; chunk_size * chunk_size];
    let mut resources = Vec::<ResourceNode>::new();
    let mut taken_ids = HashSet::<u64>::new();

    for (idx, cell) in cells.iter().enumerate() {
        if occupied[idx] {
            continue;
        }
        let coord = coords[idx];
        let water_depth = cell.water_level.saturating_sub(cell.elevation);
        let moisture = cell.moisture;

        let Some(resource_def) = pick_resource_def(
            coord.hex_x,
            coord.hex_z,
            cell,
            water_depth,
            moisture,
            config,
        ) else {
            continue;
        };

        let clump_template = pick_clump_template(coord.hex_x, coord.hex_z, resource_def.resource_type, config);
        let mut selected_members = None;
        let rotation_start = hash_unit(
            config.params.seed ^ 0xA1B2_C3D4_E5F6_0718,
            coord.hex_x as i64,
            coord.hex_z as i64,
            i64::from(resource_def.resource_type),
        ) as u8;

        for rotation in 0..6_u8 {
            let candidate = rotate_clump_members(&clump_template.members, rotation_start.wrapping_add(rotation));
            let mut valid = true;
            let mut member_indices = Vec::<usize>::with_capacity(candidate.len());

            for member in &candidate {
                let tx = coord.local_x as i32 + i32::from(member.dx);
                let tz = coord.local_z as i32 + i32::from(member.dz);
                if tx < 0 || tz < 0 || tx >= chunk_size as i32 || tz >= chunk_size as i32 {
                    valid = false;
                    break;
                }
                let tindex = (tz as usize) * chunk_size + (tx as usize);
                if occupied[tindex] {
                    valid = false;
                    break;
                }
                let tcell = cells[tindex];
                if !resource_cell_allowed(
                    &resource_def,
                    tcell,
                    tcell.water_level.saturating_sub(tcell.elevation),
                ) {
                    valid = false;
                    break;
                }
                member_indices.push(tindex);
            }

            if valid
                && validate_resource_footprint_perimeter(
                    chunk_size,
                    &member_indices,
                    cells,
                )
            {
                selected_members = Some((candidate, member_indices));
                break;
            }
        }

        let Some((members, member_indices)) = selected_members else {
            continue;
        };

        let mut min_height = i16::MAX;
        let mut max_height = i16::MIN;
        for tindex in &member_indices {
            let tcell = cells[*tindex];
            min_height = min_height.min(tcell.elevation);
            max_height = max_height.max(tcell.elevation);
        }
        if max_height.saturating_sub(min_height) > RESOURCE_MAX_FLATNESS_I16 {
            continue;
        }

        for (member, member_index) in members.iter().zip(member_indices.iter()) {
            occupied[*member_index] = true;
            let tcoord = coords[*member_index];
            let entity_id = resource_entity_id(
                config.params.seed,
                region_id,
                dimension_id,
                tcoord.hex_x,
                tcoord.hex_z,
                resource_def.resource_type,
                clump_template.clump_id,
                member.member_index,
            );

            if taken_ids.contains(&entity_id) {
                continue;
            }
            taken_ids.insert(entity_id);

            resources.push(ResourceNode {
                entity_id,
                region_id,
                dimension_id,
                chunk_x,
                chunk_y,
                hex_x: tcoord.hex_x,
                hex_z: tcoord.hex_z,
                resource_def_id: resource_def.resource_def_id,
                clump_id: clump_template.clump_id,
                resource_type: resource_def.resource_type,
                amount: if member.is_center {
                    resource_def.max_amount
                } else {
                    (resource_def.max_amount / 2).max(1)
                },
                max_amount: resource_def.max_amount,
                is_depleted: false,
                respawn_at: respawn_at_with_delay(ctx.timestamp, resource_def.respawn_seconds),
            });
        }
    }

    Ok(resources)
}

fn rotate_hex_offset(dx: i32, dz: i32, rotation: u8) -> (i32, i32) {
    match rotation % 6 {
        0 => (dx, dz),
        1 => (-dz, dx + dz),
        2 => (-(dx + dz), dx),
        3 => (-dx, -dz),
        4 => (dz, -(dx + dz)),
        _ => (dx + dz, -dx),
    }
}

fn rotate_clump_members(members: &[ClumpMember], rotation: u8) -> Vec<ClumpMember> {
    members
        .iter()
        .map(|member| {
            let (rx, rz) = rotate_hex_offset(i32::from(member.dx), i32::from(member.dz), rotation);
            let dx = match i8::try_from(rx) {
                Ok(v) => v,
                Err(_) => 0,
            };
            let dz = match i8::try_from(rz) {
                Ok(v) => v,
                Err(_) => 0,
            };
            ClumpMember {
                member_index: member.member_index,
                dx,
                dz,
                is_center: member.is_center,
            }
        })
        .collect()
}

fn validate_resource_footprint_perimeter(
    chunk_size: usize,
    member_indices: &[usize],
    cells: &[TerrainCellSample],
) -> bool {
    let mut footprint = HashSet::<usize>::with_capacity(member_indices.len() * 2);
    for &index in member_indices {
        footprint.insert(index);
    }

    let mut elevation_min = i16::MAX;
    let mut elevation_max = i16::MIN;
    for &index in member_indices {
        let value = cells[index].elevation;
        elevation_min = elevation_min.min(value);
        elevation_max = elevation_max.max(value);
        let x = index % chunk_size;
        let z = index / chunk_size;

        let perimeter = [
            (i32::try_from(x).unwrap_or(0) - 1, i32::try_from(z).unwrap_or(0)),
            (i32::try_from(x).unwrap_or(0) + 1, i32::try_from(z).unwrap_or(0)),
            (i32::try_from(x).unwrap_or(0), i32::try_from(z).unwrap_or(0) - 1),
            (i32::try_from(x).unwrap_or(0), i32::try_from(z).unwrap_or(0) + 1),
        ];

        for (nx, nz) in perimeter {
            if nx < 0 || nz < 0 {
                continue;
            }
            let nxu = match usize::try_from(nx) {
                Ok(v) if v < chunk_size => v,
                _ => continue,
            };
            let nzu = match usize::try_from(nz) {
                Ok(v) if v < chunk_size => v,
                _ => continue,
            };
            let nindex = nzu.saturating_mul(chunk_size).saturating_add(nxu);
            if footprint.contains(&nindex) {
                continue;
            }
            let neighbor = cells[nindex];
            if neighbor.water_level > neighbor.elevation {
                return false;
            }
            if (neighbor.elevation - elevation_min).abs() > RESOURCE_MAX_FLATNESS_I16 {
                return false;
            }
            if (elevation_max - neighbor.elevation).abs() > RESOURCE_MAX_FLATNESS_I16 {
                return false;
            }
        }
    }

    true
}

fn pick_resource_def(
    hex_x: i32,
    hex_z: i32,
    cell: &TerrainCellSample,
    water_depth: i16,
    _moisture: i16,
    config: &GenerationConfig,
) -> Option<ResourceGenDef> {
    let biome_bias_permille = config
        .biome_defs
        .iter()
        .find(|biome| biome.biome_id == cell.biome_id)
        .map(|biome| biome.resource_bias_permille)
        .unwrap_or(1000)
        .clamp(1, 3000);

    for def in &config.resource_defs {
        if !resource_cell_allowed(def, *cell, water_depth) {
            continue;
        }
        let threshold = f32::from(def.noise_threshold_permille.clamp(1, 1000)) / 1000.0;
        let chance = (f32::from(def.base_chance_permille.clamp(0, 1000))
            * (f32::from(biome_bias_permille) / 1000.0))
            / 1000.0;
        if chance <= 0.0 {
            continue;
        }

        let noise = fbm2d(
            hex_x as f32 * config.params.noise_scale * 1.41,
            hex_z as f32 * config.params.noise_scale * 1.41,
            config.params.seed ^ (u64::from(def.resource_type) << 20),
            config.params.noise_octaves,
            config.params.noise_persistence,
            config.params.noise_lacunarity,
        );
        let noise01 = (noise + 1.0) * 0.5;
        if noise01 < threshold {
            continue;
        }

        let roll = hash_unit(
            config.params.seed ^ 0xA9B4_0F13_98AF_1445,
            hex_x as i64,
            hex_z as i64,
            i64::from(def.resource_type),
        );
        if roll <= chance {
            return Some(ResourceGenDef {
                resource_type: def.resource_type,
                resource_def_id: def.resource_def_id,
                base_chance_permille: def.base_chance_permille,
                min_elevation: def.min_elevation,
                max_elevation: def.max_elevation,
                min_water_depth: def.min_water_depth,
                max_water_depth: def.max_water_depth,
                noise_threshold_permille: def.noise_threshold_permille,
                max_amount: def.max_amount,
                respawn_seconds: def.respawn_seconds,
            });
        }
    }
    None
}

fn pick_clump_template(
    hex_x: i32,
    hex_z: i32,
    resource_type: u8,
    config: &GenerationConfig,
) -> ClumpTemplate {
    let templates = config
        .clumps_by_resource
        .get(&resource_type)
        .cloned()
        .unwrap_or_else(|| {
            vec![ClumpTemplate {
                clump_id: i32::from(resource_type),
                members: vec![ClumpMember {
                    member_index: 0,
                    dx: 0,
                    dz: 0,
                    is_center: true,
                }],
            }]
        });

    if templates.len() == 1 {
        return templates[0].clone();
    }

    let roll = hash_u64(
        config.params.seed ^ 0x52C5_BA81_93DA_7F22,
        hex_x as i64,
        hex_z as i64,
        i64::from(resource_type),
    );
    let index = (roll as usize) % templates.len();
    templates[index].clone()
}

fn resource_cell_allowed(def: &ResourceGenDef, cell: TerrainCellSample, water_depth: i16) -> bool {
    if cell.elevation < def.min_elevation || cell.elevation > def.max_elevation {
        return false;
    }
    if water_depth < def.min_water_depth || water_depth > def.max_water_depth {
        return false;
    }
    true
}

fn resource_entity_id(
    seed: u64,
    region_id: u64,
    dimension_id: u32,
    hex_x: i32,
    hex_z: i32,
    resource_type: u8,
    clump_id: i32,
    member_index: u8,
) -> u64 {
    let h = hash_u64(
        seed ^ region_id.rotate_left(11) ^ u64::from(dimension_id).rotate_left(29),
        i64::from(hex_x),
        i64::from(hex_z),
        i64::from(clump_id),
    ) ^ hash_u64(
        seed ^ 0x4B6D_3CC1_E5A9_2F71,
        i64::from(resource_type),
        i64::from(member_index),
        0,
    );
    h.max(1)
}

fn chunk_key(region_id: u64, dimension_id: u32, chunk_x: i32, chunk_y: i32) -> String {
    format!("r{region_id}:d{dimension_id}:{chunk_x}:{chunk_y}")
}

fn sample_terrain_cell(hex_x: i32, hex_z: i32, params: &WorldGenParams) -> TerrainCellSample {
    let chunk_size = f32::from(params.terrain_chunk_size);
    let world_x = hex_x as f32 * params.noise_scale;
    let world_z = hex_z as f32 * params.noise_scale;
    let temperature = fbm2d(
        world_x * 0.35 + 37.0,
        world_z * 0.35 - 91.0,
        params.seed ^ 0x2B7E_1516_28AE_D2A6,
        params.noise_octaves.max(2),
        params.noise_persistence,
        params.noise_lacunarity,
    );
    let moisture = fbm2d(
        world_x * 0.51 - 211.0,
        world_z * 0.51 + 17.0,
        params.seed ^ 0x9E37_79B9_7F4A_7C15,
        params.noise_octaves.max(2),
        params.noise_persistence,
        params.noise_lacunarity,
    );

    let mut edge_falloff = 1.0;
    if params.size_x_chunks > 1 && params.size_y_chunks > 1 {
        let half_w = (params.size_x_chunks as f32 * chunk_size) * 0.5;
        let half_h = (params.size_y_chunks as f32 * chunk_size) * 0.5;
        let nx = (hex_x as f32 / half_w).clamp(-1.5, 1.5);
        let nz = (hex_z as f32 / half_h).clamp(-1.5, 1.5);
        let radial = (nx * nx + nz * nz).sqrt().clamp(0.0, 1.5);
        edge_falloff = (1.1 - radial.powf(1.35)).clamp(-1.0, 1.0);
    }

    let elevation_noise = fbm2d(
        world_x,
        world_z,
        params.seed,
        params.noise_octaves,
        params.noise_persistence,
        params.noise_lacunarity,
    );

    let lake_noise = fbm2d(
        world_x * 1.8 - 149.0,
        world_z * 1.8 + 61.0,
        params.seed ^ 0xC6BC_2796_92B5_C323,
        params.noise_octaves.max(2),
        params.noise_persistence,
        params.noise_lacunarity,
    );

    let base = params.sea_level as f32;
    let elevation_f = base + (elevation_noise * 18.0 + edge_falloff * 11.0 - 4.0);
    let mut elevation = elevation_f.round().clamp(i16::MIN as f32, i16::MAX as f32) as i16;
    let mut water_level = params.sea_level;

    if elevation > params.sea_level {
        let lake01 = (lake_noise + 1.0) * 0.5;
        if lake01 > 0.82 {
            let depth = (((lake01 - 0.82) / 0.18) * 5.0).round() as i16;
            water_level = elevation.saturating_add(depth.clamp(1, 5));
        }
    }

    if elevation < params.sea_level {
        water_level = params.sea_level;
    }

    let water_depth = water_level.saturating_sub(elevation);
    let moisture01 = (moisture + 1.0) * 0.5;
    let temperature01 = (temperature + 1.0) * 0.5;
    let biome_id = if water_depth >= 3 {
        5
    } else if water_depth > 0 {
        4
    } else if temperature01 < 0.25 {
        3
    } else if moisture01 < 0.25 {
        2
    } else if moisture01 > 0.65 {
        1
    } else {
        0
    };

    // Flatten tiny pits so terrain is less noisy for pathing.
    if water_depth == 0 && elevation < params.sea_level - 2 {
        elevation = params.sea_level - 2;
    }

    TerrainCellSample {
        elevation,
        water_level,
        biome_id,
        temperature: ((temperature01 * 1000.0).round() as i16).clamp(0, 1000),
        moisture: ((moisture01 * 1000.0).round() as i16).clamp(0, 1000),
        water_body_type: 0,
        distance_to_water_proxy: i16::MAX,
        distance_to_sea_proxy: i16::MAX,
        river_flow_permille: 0,
    }
}

fn seed_default_biome_defs(ctx: &ReducerContext) {
    let defs = [
        BiomeGenDef {
            biome_id: 0,
            name: "plains".to_string(),
            min_elevation: -64,
            max_elevation: 64,
            moisture_min: 300,
            moisture_max: 700,
            resource_bias_permille: 1000,
        },
        BiomeGenDef {
            biome_id: 1,
            name: "forest".to_string(),
            min_elevation: -64,
            max_elevation: 80,
            moisture_min: 600,
            moisture_max: 1000,
            resource_bias_permille: 1250,
        },
        BiomeGenDef {
            biome_id: 2,
            name: "desert".to_string(),
            min_elevation: -64,
            max_elevation: 96,
            moisture_min: 0,
            moisture_max: 350,
            resource_bias_permille: 750,
        },
        BiomeGenDef {
            biome_id: 3,
            name: "tundra".to_string(),
            min_elevation: -64,
            max_elevation: 120,
            moisture_min: 0,
            moisture_max: 1000,
            resource_bias_permille: 850,
        },
        BiomeGenDef {
            biome_id: 4,
            name: "lake".to_string(),
            min_elevation: -64,
            max_elevation: 120,
            moisture_min: 0,
            moisture_max: 1000,
            resource_bias_permille: 500,
        },
        BiomeGenDef {
            biome_id: 5,
            name: "ocean".to_string(),
            min_elevation: -64,
            max_elevation: 120,
            moisture_min: 0,
            moisture_max: 1000,
            resource_bias_permille: 350,
        },
    ];

    for def in defs {
        ctx.db.biome_gen_def().insert(def);
    }
}

fn seed_default_resource_defs(ctx: &ReducerContext) {
    let defs = [
        ResourceGenDef {
            resource_type: 1,
            resource_def_id: 1,
            base_chance_permille: 65,
            min_elevation: 8,
            max_elevation: 80,
            min_water_depth: 0,
            max_water_depth: 0,
            noise_threshold_permille: 560,
            max_amount: 100,
            respawn_seconds: 45,
        },
        ResourceGenDef {
            resource_type: 2,
            resource_def_id: 2,
            base_chance_permille: 45,
            min_elevation: 10,
            max_elevation: 96,
            min_water_depth: 0,
            max_water_depth: 0,
            noise_threshold_permille: 620,
            max_amount: 120,
            respawn_seconds: 60,
        },
        ResourceGenDef {
            resource_type: 3,
            resource_def_id: 3,
            base_chance_permille: 38,
            min_elevation: -8,
            max_elevation: 64,
            min_water_depth: 1,
            max_water_depth: 8,
            noise_threshold_permille: 650,
            max_amount: 80,
            respawn_seconds: 50,
        },
    ];

    for def in defs {
        ctx.db.resource_gen_def().insert(def);
    }
}

fn seed_default_resource_clumps(ctx: &ReducerContext) {
    let rows = [
        ResourceClumpDef {
            clump_key: "1:1:0".to_string(),
            resource_type: 1,
            clump_id: 1,
            member_index: 0,
            dx: 0,
            dz: 0,
            is_center: true,
        },
        ResourceClumpDef {
            clump_key: "1:1:1".to_string(),
            resource_type: 1,
            clump_id: 1,
            member_index: 1,
            dx: 1,
            dz: 0,
            is_center: false,
        },
        ResourceClumpDef {
            clump_key: "1:1:2".to_string(),
            resource_type: 1,
            clump_id: 1,
            member_index: 2,
            dx: 0,
            dz: 1,
            is_center: false,
        },
        ResourceClumpDef {
            clump_key: "2:2:0".to_string(),
            resource_type: 2,
            clump_id: 2,
            member_index: 0,
            dx: 0,
            dz: 0,
            is_center: true,
        },
        ResourceClumpDef {
            clump_key: "2:2:1".to_string(),
            resource_type: 2,
            clump_id: 2,
            member_index: 1,
            dx: -1,
            dz: 0,
            is_center: false,
        },
        ResourceClumpDef {
            clump_key: "3:3:0".to_string(),
            resource_type: 3,
            clump_id: 3,
            member_index: 0,
            dx: 0,
            dz: 0,
            is_center: true,
        },
    ];

    for row in rows {
        ctx.db.resource_clump_def().insert(row);
    }
}

fn respawn_at_with_delay(base: Timestamp, seconds: u32) -> Timestamp {
    base + TimeDuration::from_duration(Duration::from_secs(u64::from(seconds)))
}

fn encode_cell_payload_i16_to_bytes(payload: &[i16], _version: u16) -> Vec<u8> {
    let mut out = Vec::<u8>::with_capacity(payload.len() * 2);
    for value in payload {
        out.extend_from_slice(&value.to_le_bytes());
    }
    out
}

fn fbm2d(x: f32, z: f32, seed: u64, octaves: u8, persistence: f32, lacunarity: f32) -> f32 {
    let mut frequency = 1.0_f32;
    let mut amplitude = 1.0_f32;
    let mut sum = 0.0_f32;
    let mut norm = 0.0_f32;
    let octaves = octaves.clamp(1, 8);

    for octave in 0..octaves {
        let n = value_noise_2d(
            x * frequency,
            z * frequency,
            seed ^ (u64::from(octave) * 0x9E37_79B9_7F4A_7C15),
        );
        sum += n * amplitude;
        norm += amplitude;
        amplitude *= persistence.clamp(0.01, 1.0);
        frequency *= lacunarity.max(1.0);
    }

    if norm <= f32::EPSILON {
        0.0
    } else {
        (sum / norm).clamp(-1.0, 1.0)
    }
}

fn value_noise_2d(x: f32, z: f32, seed: u64) -> f32 {
    let x0 = x.floor() as i64;
    let z0 = z.floor() as i64;
    let x1 = x0 + 1;
    let z1 = z0 + 1;
    let tx = smoothstep(x - x.floor());
    let tz = smoothstep(z - z.floor());

    let v00 = hash_value(seed, x0, z0);
    let v10 = hash_value(seed, x1, z0);
    let v01 = hash_value(seed, x0, z1);
    let v11 = hash_value(seed, x1, z1);

    let a = lerp(v00, v10, tx);
    let b = lerp(v01, v11, tx);
    lerp(a, b, tz)
}

fn hash_value(seed: u64, x: i64, z: i64) -> f32 {
    let u = hash_u64(seed, x, z, 0);
    let unit = ((u >> 11) as f64) / ((1_u64 << 53) as f64);
    (unit as f32) * 2.0 - 1.0
}

fn hash_unit(seed: u64, a: i64, b: i64, c: i64) -> f32 {
    let u = hash_u64(seed, a, b, c);
    (((u >> 11) as f64) / ((1_u64 << 53) as f64)) as f32
}

fn hash_u64(seed: u64, a: i64, b: i64, c: i64) -> u64 {
    let mut x = seed
        ^ splitmix64(a as u64)
        ^ splitmix64((b as u64).rotate_left(17))
        ^ splitmix64((c as u64).rotate_right(11));
    x = splitmix64(x);
    x = splitmix64(x ^ 0xD6E8_FEB8_6659_FD93);
    x
}

fn splitmix64(mut x: u64) -> u64 {
    x = x.wrapping_add(0x9E37_79B9_7F4A_7C15);
    x = (x ^ (x >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
    x = (x ^ (x >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
    x ^ (x >> 31)
}

fn smoothstep(t: f32) -> f32 {
    let t = t.clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t.clamp(0.0, 1.0)
}

#[cfg(test)]
mod tests {
    use super::{encode_cell_payload_i16_to_bytes, CELL_PAYLOAD_VERSION_V1};

    fn decode_i16_le(bytes: &[u8]) -> Vec<i16> {
        assert_eq!(bytes.len() % 2, 0);
        let mut out = Vec::<i16>::with_capacity(bytes.len() / 2);
        for pair in bytes.chunks_exact(2) {
            out.push(i16::from_le_bytes([pair[0], pair[1]]));
        }
        out
    }

    #[test]
    fn test_cell_payload_encoding_v1_length_matches() {
        let values = vec![1_i16, -2_i16, 3_i16, 4_i16, -8_i16, 99_i16];
        let encoded = encode_cell_payload_i16_to_bytes(&values, CELL_PAYLOAD_VERSION_V1);
        assert_eq!(encoded.len(), values.len() * 2);
    }

    #[test]
    fn test_cell_payload_encoding_v1_roundtrip() {
        let values = vec![12_i16, 14_i16, 2_i16, 1_i16, -5_i16, 8_i16, 0_i16, 0_i16];
        let encoded = encode_cell_payload_i16_to_bytes(&values, CELL_PAYLOAD_VERSION_V1);
        let decoded = decode_i16_le(&encoded);
        assert_eq!(decoded, values);
    }
}
