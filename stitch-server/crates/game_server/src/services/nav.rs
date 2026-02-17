use std::collections::HashMap;

use spacetimedb::{ReducerContext, Table};

use crate::services::hex_coords::{world_to_hex, HexCoord, HexDirection};
use crate::tables::world_gen::world_gen_params;
use crate::tables::world_state::terrain_chunk_payload;
use crate::tables::TerrainChunkPayload;
use crate::worldgen::{DEFAULT_WORLD_CHUNK_SIZE, WORLD_GEN_PARAMS_ID};

pub const TERRAIN_REASON_BLOCKED: &str = "terrain_blocked";
pub const TERRAIN_REASON_SLOPE: &str = "slope_blocked";
pub const TERRAIN_REASON_MISSING: &str = "terrain_missing";
pub const TERRAIN_REASON_INVALID_INPUT: &str = "invalid_position";

pub const TERRAIN_PAYLOAD_VERSION_V1: u16 = 1;
pub const TERRAIN_WATER_FLAG: u16 = 0b0000_0000_0000_0001;
pub const DEFAULT_SLOPE_THRESHOLD: i16 = 2;
pub const DEFAULT_SLOPE_PENALTY_FACTOR: f32 = 0.05;

#[derive(Debug, Clone, Copy)]
pub struct TerrainCell {
    pub elevation: i16,
    pub water_level: i16,
    pub biome_id: i16,
    pub flags: u16,
}

impl TerrainCell {
    pub fn is_water(self) -> bool {
        (self.flags & TERRAIN_WATER_FLAG) != 0 || self.water_level > self.elevation
    }
}

pub struct NavGrid {
    chunk_size: i32,
    cells_by_chunk: HashMap<(i32, i32), TerrainChunkPayload>,
    slope_threshold: i16,
}

#[derive(Debug, Clone, Copy)]
pub struct NavNeighbor {
    pub coord: HexCoord,
    pub move_cost: f32,
}

impl NavGrid {
    pub fn new(chunk_size: i32, cells_by_chunk: HashMap<(i32, i32), TerrainChunkPayload>) -> Self {
        Self {
            chunk_size: chunk_size.max(1),
            cells_by_chunk,
            slope_threshold: DEFAULT_SLOPE_THRESHOLD,
        }
    }

    pub fn chunk_size(&self) -> i32 {
        self.chunk_size
    }

    pub fn is_walkable(self: &Self, coord: HexCoord) -> Result<(), &'static str> {
        let cell = self.cell_at(coord).ok_or(TERRAIN_REASON_MISSING)?;
        if cell.is_water() {
            return Err(TERRAIN_REASON_BLOCKED);
        }

        // Flat neighbors define immediate slope constraints for traversability.
        for direction in HexDirection::FLAT {
            let neighbor_coord = coord.neighbor(direction);
            let Some(neighbor) = self.cell_at(neighbor_coord) else {
                continue;
            };
            if neighbor.is_water() {
                continue;
            }
            let slope = (cell.elevation - neighbor.elevation).abs();
            if slope > self.slope_threshold {
                return Err(TERRAIN_REASON_SLOPE);
            }
        }

        Ok(())
    }

    pub fn transition_cost(
        self: &Self,
        from: HexCoord,
        direction: HexDirection,
    ) -> Result<NavNeighbor, &'static str> {
        let to = from.neighbor(direction);
        self.is_walkable(from)?;
        self.is_walkable(to)?;
        self.validate_world_segment(from, to)?;

        let from_cell = self.cell_at(from).ok_or(TERRAIN_REASON_MISSING)?;
        let to_cell = self.cell_at(to).ok_or(TERRAIN_REASON_MISSING)?;
        let slope = (from_cell.elevation - to_cell.elevation).abs() as f32;
        let move_cost = direction.movement_cost() + slope * DEFAULT_SLOPE_PENALTY_FACTOR;

        Ok(NavNeighbor {
            coord: to,
            move_cost,
        })
    }

    pub fn neighbors(self: &Self, from: HexCoord) -> Vec<NavNeighbor> {
        let mut out = Vec::with_capacity(HexDirection::ALL.len());
        for direction in HexDirection::ALL {
            if let Ok(edge) = self.transition_cost(from, direction) {
                out.push(edge);
            }
        }
        out
    }

    pub fn validate_world_segment_positions(
        self: &Self,
        from: &[f32],
        to: &[f32],
    ) -> Result<(), &'static str> {
        if from.len() < 3 || to.len() < 3 {
            return Err(TERRAIN_REASON_INVALID_INPUT);
        }
        let (sx, sz) = (from[0], from[2]);
        let (tx, tz) = (to[0], to[2]);
        if !sx.is_finite() || !sz.is_finite() || !tx.is_finite() || !tz.is_finite() {
            return Err(TERRAIN_REASON_INVALID_INPUT);
        }

        let dx = tx - sx;
        let dz = tz - sz;
        let steps = (dx.abs().max(dz.abs()) * 2.0).ceil() as i32;
        let steps = steps.max(1);

        let mut previous: Option<HexCoord> = None;
        for i in 0..=steps {
            let t = i as f32 / steps as f32;
            let x = sx + dx * t;
            let z = sz + dz * t;
            let coord = world_to_hex(x, z, 1);
            if previous == Some(coord) {
                continue;
            }
            self.is_walkable(coord)?;
            previous = Some(coord);
        }
        Ok(())
    }

    pub fn validate_world_segment(
        self: &Self,
        from: HexCoord,
        to: HexCoord,
    ) -> Result<(), &'static str> {
        let from_vec = [from.q as f32 + 0.5, 0.0, from.r as f32 + 0.5];
        let to_vec = [to.q as f32 + 0.5, 0.0, to.r as f32 + 0.5];
        self.validate_world_segment_positions(&from_vec, &to_vec)
    }

    pub fn cell_at(self: &Self, coord: HexCoord) -> Option<TerrainCell> {
        let chunk_x = coord.q.div_euclid(self.chunk_size);
        let chunk_y = coord.r.div_euclid(self.chunk_size);
        let local_x = coord.q.rem_euclid(self.chunk_size) as usize;
        let local_y = coord.r.rem_euclid(self.chunk_size) as usize;

        let row = self.cells_by_chunk.get(&(chunk_x, chunk_y))?;
        if row.cell_payload_version != TERRAIN_PAYLOAD_VERSION_V1 {
            return None;
        }

        let chunk_size = self.chunk_size as usize;
        let byte_index = (local_y * chunk_size + local_x) * 8;
        if byte_index + 7 >= row.cell_payload_bytes.len() {
            return None;
        }

        Some(TerrainCell {
            elevation: read_i16_le(&row.cell_payload_bytes, byte_index),
            water_level: read_i16_le(&row.cell_payload_bytes, byte_index + 2),
            biome_id: read_i16_le(&row.cell_payload_bytes, byte_index + 4),
            flags: read_u16_le(&row.cell_payload_bytes, byte_index + 6),
        })
    }
}

pub fn build_nav_grid(ctx: &ReducerContext, region_id: u64) -> NavGrid {
    let chunk_size = ctx
        .db
        .world_gen_params()
        .id()
        .find(WORLD_GEN_PARAMS_ID)
        .map(|params| i32::from(params.terrain_chunk_size).max(1))
        .unwrap_or(i32::from(DEFAULT_WORLD_CHUNK_SIZE));

    let by_chunk = ctx
        .db
        .terrain_chunk_payload()
        .iter()
        .filter(|row| row.region_id == region_id)
        .map(|row| ((row.chunk_x, row.chunk_y), row))
        .collect::<HashMap<_, _>>();

    NavGrid::new(chunk_size, by_chunk)
}

pub fn validate_segment_positions(
    ctx: &ReducerContext,
    region_id: u64,
    from: &[f32],
    to: &[f32],
) -> Result<(), &'static str> {
    let nav = build_nav_grid(ctx, region_id);
    nav.validate_world_segment_positions(from, to)
}

fn read_i16_le(bytes: &[u8], index: usize) -> i16 {
    i16::from_le_bytes([bytes[index], bytes[index + 1]])
}

fn read_u16_le(bytes: &[u8], index: usize) -> u16 {
    u16::from_le_bytes([bytes[index], bytes[index + 1]])
}

#[cfg(test)]
mod tests {
    use super::{read_i16_le, read_u16_le, TERRAIN_WATER_FLAG};

    #[test]
    fn read_i16_matches_little_endian_encoding() {
        let bytes = [0x34_u8, 0x12_u8, 0xCC_u8, 0xFF_u8];
        assert_eq!(read_i16_le(&bytes, 0), 0x1234_i16);
        assert_eq!(read_i16_le(&bytes, 2), -52_i16);
    }

    #[test]
    fn read_u16_matches_little_endian_encoding() {
        let bytes = [0x01_u8, 0x00_u8, 0xFF_u8, 0x00_u8];
        assert_eq!(read_u16_le(&bytes, 0), TERRAIN_WATER_FLAG);
        assert_eq!(read_u16_le(&bytes, 2), 255_u16);
    }
}
