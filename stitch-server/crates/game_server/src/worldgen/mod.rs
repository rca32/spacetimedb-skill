use std::collections::{HashMap, HashSet, VecDeque};
use std::time::Duration;

use spacetimedb::{ReducerContext, Table, TimeDuration, Timestamp};

use crate::services::hex_coords::DEFAULT_WORLD_DIMENSION_ID;
use crate::tables::world_gen::{
    biome_gen_def, resource_clump_def, resource_gen_def, world_gen_params,
};
use crate::tables::world_state::{
    region_state, resource_node, terrain_chunk, terrain_chunk_payload, terrain_chunk_stream,
};
use crate::tables::{
    BiomeGenDef, RegionState, ResourceClumpDef, ResourceGenDef, ResourceNode, TerrainChunk,
    TerrainChunkPayload, TerrainChunkStream, WorldGenParams,
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

const MIN_LAKE_SIZE_CELLS: usize = 6;
const LAKE_DEPTH_MAX: i16 = 5;
const RESOURCE_MAX_FLATNESS_I16: i16 = 8;
const RESOURCE_REQUEST_MAX: u32 = 1_000;
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
    moisture: i16,
    water_body_type: u8,
    distance_to_water_proxy: i16,
    distance_to_sea_proxy: i16,
    river_flow_permille: i16,
}

#[derive(Debug, Clone, Copy)]
struct HydroCell {
    index: usize,
    elevation: i16,
    water_level: i16,
    is_land_water: bool,
    water_body_type: u8,
}

#[derive(Debug, Clone)]
struct LakeBody {
    id: usize,
    cells: Vec<usize>,
    surface_level: i16,
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

    let config = load_generation_config(ctx, params)?;
    let chunk_size = i32::from(config.params.terrain_chunk_size);
    let mut summary = GenerateSummary::default();

    let x_start = -(config.params.size_x_chunks / 2);
    let z_start = -(config.params.size_y_chunks / 2);

    for z_off in 0..config.params.size_y_chunks {
        for x_off in 0..config.params.size_x_chunks {
            let chunk_x = x_start + x_off;
            let chunk_y = z_start + z_off;
            let build = build_chunk(
                ctx,
                region_id,
                dimension_id,
                chunk_x,
                chunk_y,
                chunk_size,
                &config,
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
    }

    Ok(summary)
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

    let config = load_generation_config(ctx, &params)?;
    let chunk_size = i32::from(config.params.terrain_chunk_size);
    let mut summary = GenerateSummary::default();

    for chunk_y in from_chunk_y..=to_chunk_y {
        for chunk_x in from_chunk_x..=to_chunk_x {
            let build = build_chunk(
                ctx,
                region_id,
                dimension_id,
                chunk_x,
                chunk_y,
                chunk_size,
                &config,
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
    }

    Ok(summary)
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
            updated_at: params.updated_at,
        },
        biome_defs,
        resource_defs,
        clumps_by_resource,
    })
}

fn build_chunk(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
    chunk_size: i32,
    config: &GenerationConfig,
) -> Result<ChunkBuild, String> {
    let chunk_size_usize =
        usize::try_from(chunk_size).map_err(|_| "chunk_size overflow".to_string())?;
    if chunk_size_usize == 0 {
        return Err("chunk_size must be > 0".to_string());
    }

    let mut cells: Vec<TerrainCellSample> = Vec::with_capacity(chunk_size_usize * chunk_size_usize);
    let mut coords: Vec<CellCoord> = Vec::with_capacity(chunk_size_usize * chunk_size_usize);
    let mut biome_counts = HashMap::<u16, u32>::new();
    let mut water_count = 0_u32;
    let mut height_min = i16::MAX;
    let mut height_max = i16::MIN;

    for local_z in 0..chunk_size_usize {
        for local_x in 0..chunk_size_usize {
            let lx = i32::try_from(local_x).map_err(|_| "local_x overflow".to_string())?;
            let lz = i32::try_from(local_z).map_err(|_| "local_z overflow".to_string())?;
            let hex_x = chunk_x.saturating_mul(chunk_size).saturating_add(lx);
            let hex_z = chunk_y.saturating_mul(chunk_size).saturating_add(lz);

            let cell = sample_terrain_cell(hex_x, hex_z, &config.params);
            let mut cell = cell;
            cell.water_body_type = if cell.elevation < config.params.sea_level {
                1
            } else {
                0
            };
            if cell.water_level > cell.elevation {
                water_count = water_count.saturating_add(1);
            }
            if cell.elevation < height_min {
                height_min = cell.elevation;
            }
            if cell.elevation > height_max {
                height_max = cell.elevation;
            }
            *biome_counts.entry(cell.biome_id).or_insert(0) += 1;
            cells.push(cell);
            coords.push(CellCoord {
                local_x,
                local_z,
                hex_x,
                hex_z,
            });
        }
    }

    compute_chunk_hydrology(&mut cells, chunk_size_usize, &config.params);

    let biome_id = biome_counts
        .into_iter()
        .max_by_key(|(_, count)| *count)
        .map(|(biome, _)| biome)
        .unwrap_or(0);
    let total_cells = u32::try_from(chunk_size_usize * chunk_size_usize)
        .map_err(|_| "cell count overflow".to_string())?;
    let water_ratio_permille =
        (((water_count as f64 / total_cells as f64) * 1000.0).round() as i64).clamp(0, 1000) as u16;

    let mut cell_payload = Vec::<i16>::with_capacity(chunk_size_usize * chunk_size_usize * 8);
    let cell_payload_version = CELL_PAYLOAD_VERSION_V2;
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
    let cell_count = u32::try_from(chunk_size_usize * chunk_size_usize)
        .map_err(|_| "cell count overflow".to_string())?;
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
        cell_count,
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

fn compute_chunk_hydrology(
    cells: &mut [TerrainCellSample],
    chunk_size: usize,
    params: &WorldGenParams,
) {
    if chunk_size == 0 {
        return;
    }

    let sea_level = params.sea_level;
    let width = chunk_size;
    let height = chunk_size;
    let total = width.saturating_mul(height);

    for index in 0..cells.len() {
        if cells[index].water_level > cells[index].elevation {
            cells[index].water_body_type = if cells[index].elevation < sea_level {
                1
            } else {
                2
            };
            cells[index].distance_to_water_proxy = 0;
            cells[index].distance_to_sea_proxy = if cells[index].water_body_type == 1 {
                0
            } else {
                2000
            };
        } else {
            cells[index].distance_to_water_proxy = i16::MAX;
            cells[index].distance_to_sea_proxy = i16::MAX;
            if cells[index].water_body_type == 0 {
                cells[index].water_body_type = 0;
            }
            cells[index].river_flow_permille = 0;
        }
    }

    let mut visited = vec![false; total];
    let mut components: Vec<LakeBody> = Vec::new();

    for index in 0..total {
        if visited[index] || cells[index].water_body_type != 2 {
            continue;
        }

        let mut stack = vec![index];
        visited[index] = true;
        let mut component = Vec::new();
        while let Some(idx) = stack.pop() {
            component.push(idx);
            let x = idx % width;
            let z = idx / width;
            for (dx, dz) in [(0_i32, -1_i32), (-1, 0), (1, 0), (0, 1)] {
                let nx = i32::try_from(x).unwrap_or(0).saturating_add(dx);
                let nz = i32::try_from(z).unwrap_or(0).saturating_add(dz);
                if nx < 0 || nz < 0 {
                    continue;
                }
                let nxu = match usize::try_from(nx) {
                    Ok(v) if v < width => v,
                    _ => continue,
                };
                let nzu = match usize::try_from(nz) {
                    Ok(v) if v < height => v,
                    _ => continue,
                };
                let nidx = nzu.saturating_mul(width).saturating_add(nxu);
                if visited[nidx] || cells[nidx].water_body_type != 2 {
                    continue;
                }
                visited[nidx] = true;
                stack.push(nidx);
            }
        }
        if component.len() >= MIN_LAKE_SIZE_CELLS {
            components.push(LakeBody {
                id: components.len(),
                cells: component,
                surface_level: sea_level,
            });
        }
    }

    for component in components.iter() {
        let mut levels: Vec<i16> = component
            .cells
            .iter()
            .map(|idx| cells[*idx].water_level)
            .collect();
        levels.sort_unstable();
        let p75 = levels.get(levels.len() * 3 / 4).copied().unwrap_or(sea_level);
        let surface = (p75 as i32).clamp(i32::from(sea_level), i32::from(i16::MAX)) as i16;
        for idx in &component.cells {
            let idx = *idx;
            let elevation = cells[idx].elevation;
            cells[idx].water_level = surface;
            cells[idx].elevation = elevation.min(surface.saturating_sub(LAKE_DEPTH_MAX));
            cells[idx].water_body_type = 2;
        }
    }

    let mut queue = VecDeque::new();
    for idx in 0..total {
        if cells[idx].water_body_type != 0 {
            cells[idx].distance_to_water_proxy = 0;
            cells[idx].distance_to_sea_proxy = if cells[idx].water_body_type == 1 {
                0
            } else {
                cells[idx].distance_to_sea_proxy
            };
            queue.push_back(idx as i32);
        } else {
            cells[idx].distance_to_water_proxy = i16::MAX;
            cells[idx].distance_to_sea_proxy = i16::MAX;
        }
    }

    while let Some(idx) = queue.pop_front() {
        let idx = match usize::try_from(idx) {
            Ok(v) => v,
            Err(_) => continue,
        };
        let x = idx % width;
        let z = idx / width;
        let source_water = cells[idx].distance_to_water_proxy;
        let source_sea = cells[idx].distance_to_sea_proxy;
        for (dx, dz) in [(0_i32, -1_i32), (-1, 0), (1, 0), (0, 1)] {
            let nx = i32::try_from(x).unwrap_or(0).saturating_add(dx);
            let nz = i32::try_from(z).unwrap_or(0).saturating_add(dz);
            if nx < 0 || nz < 0 {
                continue;
            }
            let nxu = match usize::try_from(nx) {
                Ok(v) if v < width => v,
                _ => continue,
            };
            let nzu = match usize::try_from(nz) {
                Ok(v) if v < height => v,
                _ => continue,
            };
            let nidx = nzu.saturating_mul(width).saturating_add(nxu);
            if cells[nidx].water_body_type == 0 {
                if cells[nidx].distance_to_water_proxy > source_water.saturating_add(1) {
                    cells[nidx].distance_to_water_proxy = source_water.saturating_add(1);
                    queue.push_back(i32::try_from(nidx).unwrap_or(0));
                }
                if cells[nidx].distance_to_sea_proxy > source_sea.saturating_add(1) {
                    cells[nidx].distance_to_sea_proxy = source_sea.saturating_add(1);
                    queue.push_back(i32::try_from(nidx).unwrap_or(0));
                }
            }
        }
    }

    for idx in 0..total {
        let water_dist = cells[idx].distance_to_water_proxy.min(i16::MAX);
        let sea_dist = cells[idx].distance_to_sea_proxy.min(i16::MAX);
        cells[idx].distance_to_water_proxy = water_dist;
        cells[idx].distance_to_sea_proxy = sea_dist;
        if cells[idx].water_body_type == 2 {
            let depth = cells[idx].water_level.saturating_sub(cells[idx].elevation);
            if depth < cells[idx].distance_to_water_proxy {
                cells[idx].river_flow_permille = 1_000;
            } else {
                cells[idx].river_flow_permille = 300;
            }
        } else {
            cells[idx].river_flow_permille = 0;
        }
    }
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
