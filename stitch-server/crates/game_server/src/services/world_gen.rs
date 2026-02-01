use spacetimedb::SpacetimeType;

use crate::tables::{TerrainCell, TerrainChunk};

pub const CHUNK_WIDTH: i32 = 32;
pub const CHUNK_HEIGHT: i32 = 32;
pub const CHUNK_SIZE: usize = (CHUNK_WIDTH as usize) * (CHUNK_HEIGHT as usize);

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, SpacetimeType)]
pub struct HexCoordinates {
    pub x: i32,
    pub z: i32,
}

impl HexCoordinates {
    pub fn y(&self) -> i32 {
        -self.x - self.z
    }

    pub fn distance_to(&self, other: &HexCoordinates) -> i32 {
        let dx = (other.x - self.x).abs();
        let dy = (other.y() - self.y()).abs();
        let dz = (other.z - self.z).abs();
        (dx + dy + dz) / 2
    }

    pub fn neighbor(&self, direction: HexDirection) -> HexCoordinates {
        let (dx, dz) = direction.to_vector();
        HexCoordinates {
            x: self.x + dx,
            z: self.z + dz,
        }
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum HexDirection {
    East,
    NorthEast,
    NorthWest,
    West,
    SouthWest,
    SouthEast,
}

impl HexDirection {
    pub fn to_vector(self) -> (i32, i32) {
        match self {
            HexDirection::East => (1, 0),
            HexDirection::NorthEast => (1, -1),
            HexDirection::NorthWest => (0, -1),
            HexDirection::West => (-1, 0),
            HexDirection::SouthWest => (-1, 1),
            HexDirection::SouthEast => (0, 1),
        }
    }

    pub fn rotate_clockwise(self) -> HexDirection {
        match self {
            HexDirection::East => HexDirection::SouthEast,
            HexDirection::SouthEast => HexDirection::SouthWest,
            HexDirection::SouthWest => HexDirection::West,
            HexDirection::West => HexDirection::NorthWest,
            HexDirection::NorthWest => HexDirection::NorthEast,
            HexDirection::NorthEast => HexDirection::East,
        }
    }

    pub fn all() -> [HexDirection; 6] {
        [
            HexDirection::East,
            HexDirection::NorthEast,
            HexDirection::NorthWest,
            HexDirection::West,
            HexDirection::SouthWest,
            HexDirection::SouthEast,
        ]
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct ChunkCoordinates {
    pub x: i32,
    pub z: i32,
    pub dimension: i32,
}

impl ChunkCoordinates {
    pub fn to_index(&self) -> i64 {
        (self.dimension as i64) * 1_000_000 + (self.z as i64) * 1000 + (self.x as i64) + 1
    }

    pub fn from_hex(hex: &HexCoordinates) -> ChunkCoordinates {
        ChunkCoordinates {
            x: hex.x.div_euclid(CHUNK_WIDTH),
            z: hex.z.div_euclid(CHUNK_HEIGHT),
            dimension: 0,
        }
    }
}

pub fn generate_chunk(seed: u64, coords: ChunkCoordinates) -> TerrainChunk {
    let chunk_id = coords.to_index();
    let mut cells = Vec::with_capacity(CHUNK_SIZE);

    for local_z in 0..CHUNK_HEIGHT {
        for local_x in 0..CHUNK_WIDTH {
            let hex_x = coords.x * CHUNK_WIDTH + local_x;
            let hex_z = coords.z * CHUNK_HEIGHT + local_z;
            let value = hash_u64(seed, hex_x, hex_z);

            let elevation = ((value & 0x0fff) as i16) - 1024;
            let biome_id = ((value >> 12) & 0x00ff) as u16;
            let vegetation_density = ((value >> 20) & 0x00ff) as u8;

            cells.push(TerrainCell {
                chunk_id,
                cell_index: (local_z * CHUNK_WIDTH + local_x) as u16,
                hex_x,
                hex_z,
                elevation,
                water_level: 0,
                water_body_type: 0,
                biome_id,
                biome_blend: 255,
                vegetation_density,
                zoning_type: 0,
                original_elevation: elevation,
                distance_to_water: 0,
                distance_to_sea: 0,
            });
        }
    }

    TerrainChunk {
        chunk_id,
        dimension: coords.dimension,
        chunk_x: coords.x,
        chunk_z: coords.z,
        is_generated: true,
        generation_seed: seed,
        biome_distribution: Vec::new(),
        cells,
    }
}

fn hash_u64(seed: u64, x: i32, z: i32) -> u64 {
    let mut v = seed ^ ((x as u64) << 32) ^ (z as u64);
    v ^= v >> 33;
    v = v.wrapping_mul(0xff51afd7ed558ccd);
    v ^= v >> 33;
    v = v.wrapping_mul(0xc4ceb9fe1a85ec53);
    v ^ (v >> 33)
}
