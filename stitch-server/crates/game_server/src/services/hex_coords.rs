use std::fmt;

pub const DEFAULT_WORLD_DIMENSION_ID: u32 = 1;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HexCoord {
    pub q: i32,
    pub r: i32,
    pub dimension: u32,
}

impl HexCoord {
    pub const fn new(q: i32, r: i32, dimension: u32) -> Self {
        Self { q, r, dimension }
    }

    pub const fn zero(dimension: u32) -> Self {
        Self {
            q: 0,
            r: 0,
            dimension,
        }
    }

    pub const fn cube_y(self) -> i32 {
        -self.q - self.r
    }

    pub fn neighbor(self, direction: HexDirection) -> Self {
        self.neighbor_n(direction, 1)
    }

    pub fn neighbor_n(self, direction: HexDirection, n: i32) -> Self {
        let (dq, dr) = direction.offset();
        Self {
            q: self.q.saturating_add(dq.saturating_mul(n)),
            r: self.r.saturating_add(dr.saturating_mul(n)),
            dimension: self.dimension,
        }
    }

    pub fn distance_to(self, other: Self) -> i32 {
        let dq = (other.q - self.q).abs();
        let dr = (other.r - self.r).abs();
        let dy = (other.cube_y() - self.cube_y()).abs();
        (dq + dr + dy) / 2
    }

    pub fn ring(center: Self, radius: i32) -> Vec<Self> {
        if radius <= 0 {
            return vec![center];
        }

        let mut out = Vec::with_capacity((radius * 6) as usize);
        let mut direction = HexDirection::NE;
        let mut cursor = center.neighbor_n(
            HexDirection::next_flat(HexDirection::next_flat(direction)),
            radius,
        );

        for _ in 0..6 {
            for _ in 0..radius {
                cursor = cursor.neighbor(direction);
                out.push(cursor);
            }
            direction = HexDirection::previous_flat(direction);
        }

        out
    }

    pub fn coordinates_in_radius(center: Self, radius: i32) -> Vec<Self> {
        if radius <= 0 {
            return Vec::new();
        }

        let mut out = Vec::new();
        for r in 1..=radius {
            out.extend(Self::ring(center, r));
        }
        out
    }

    pub fn closest(self, locations: &[Self]) -> Option<Self> {
        let mut best = None;
        let mut best_distance = i32::MAX;
        for coord in locations {
            let distance = self.distance_to(*coord);
            if distance < best_distance {
                best_distance = distance;
                best = Some(*coord);
            }
        }
        best
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OffsetCoord {
    pub x: i32,
    pub z: i32,
    pub dimension: u32,
}

impl OffsetCoord {
    pub const fn new(x: i32, z: i32, dimension: u32) -> Self {
        Self { x, z, dimension }
    }
}

impl From<HexCoord> for OffsetCoord {
    fn from(value: HexCoord) -> Self {
        Self {
            x: value.q + value.r / 2,
            z: value.r,
            dimension: value.dimension,
        }
    }
}

impl From<OffsetCoord> for HexCoord {
    fn from(value: OffsetCoord) -> Self {
        Self {
            q: value.x - value.z / 2,
            r: value.z,
            dimension: value.dimension,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[repr(i32)]
pub enum HexDirection {
    NE = 0,
    ENE = 1,
    E = 2,
    ESE = 3,
    SE = 4,
    S = 5,
    SW = 6,
    WSW = 7,
    W = 8,
    WNW = 9,
    NW = 10,
    N = 11,
}

impl HexDirection {
    pub const ALL: [HexDirection; 12] = [
        HexDirection::NE,
        HexDirection::ENE,
        HexDirection::E,
        HexDirection::ESE,
        HexDirection::SE,
        HexDirection::S,
        HexDirection::SW,
        HexDirection::WSW,
        HexDirection::W,
        HexDirection::WNW,
        HexDirection::NW,
        HexDirection::N,
    ];

    pub const FLAT: [HexDirection; 6] = [
        HexDirection::NE,
        HexDirection::E,
        HexDirection::SE,
        HexDirection::SW,
        HexDirection::W,
        HexDirection::NW,
    ];

    pub const POINTY: [HexDirection; 6] = [
        HexDirection::ENE,
        HexDirection::ESE,
        HexDirection::S,
        HexDirection::WSW,
        HexDirection::WNW,
        HexDirection::N,
    ];

    pub fn from_index(index: i32) -> Self {
        match index.rem_euclid(12) {
            0 => Self::NE,
            1 => Self::ENE,
            2 => Self::E,
            3 => Self::ESE,
            4 => Self::SE,
            5 => Self::S,
            6 => Self::SW,
            7 => Self::WSW,
            8 => Self::W,
            9 => Self::WNW,
            10 => Self::NW,
            _ => Self::N,
        }
    }

    pub fn next(direction: HexDirection) -> HexDirection {
        HexDirection::from_index(direction as i32 + 1)
    }

    pub fn previous(direction: HexDirection) -> HexDirection {
        HexDirection::from_index(direction as i32 - 1)
    }

    pub fn next_flat(direction: HexDirection) -> HexDirection {
        if direction == HexDirection::NW {
            HexDirection::NE
        } else {
            HexDirection::from_index(((direction as i32 >> 1) + 1) << 1)
        }
    }

    pub fn previous_flat(direction: HexDirection) -> HexDirection {
        if direction == HexDirection::NE {
            HexDirection::NW
        } else {
            HexDirection::from_index(((direction as i32 >> 1) - 1) << 1)
        }
    }

    pub const fn is_pointy(self) -> bool {
        (self as i32) % 2 == 1
    }

    pub const fn movement_cost(self) -> f32 {
        if self.is_pointy() {
            1.5
        } else {
            1.0
        }
    }

    pub const fn offset(self) -> (i32, i32) {
        match self {
            HexDirection::NE => (0, 1),
            HexDirection::ENE => (1, 1),
            HexDirection::E => (1, 0),
            HexDirection::ESE => (2, -1),
            HexDirection::SE => (1, -1),
            HexDirection::S => (1, -2),
            HexDirection::SW => (0, -1),
            HexDirection::WSW => (-1, -1),
            HexDirection::W => (-1, 0),
            HexDirection::WNW => (-2, 1),
            HexDirection::NW => (-1, 1),
            HexDirection::N => (-1, 2),
        }
    }
}

impl fmt::Display for HexCoord {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "HexCoord({}, {}, dim={})",
            self.q, self.r, self.dimension
        )
    }
}

pub fn world_to_hex(x: f32, z: f32, dimension: u32) -> HexCoord {
    let q = if x.is_finite() { x.floor() } else { 0.0 };
    let r = if z.is_finite() { z.floor() } else { 0.0 };
    HexCoord::new(q as i32, r as i32, dimension)
}

#[cfg(test)]
mod tests {
    use super::{HexCoord, HexDirection, OffsetCoord};

    #[test]
    fn offset_roundtrip_matches_original() {
        let hex = HexCoord::new(7, -5, 3);
        let offset: OffsetCoord = hex.into();
        let reconstructed: HexCoord = offset.into();
        assert_eq!(hex, reconstructed);
    }

    #[test]
    fn distance_works_for_center_and_neighbor() {
        let origin = HexCoord::zero(1);
        let near = origin.neighbor(HexDirection::NE);
        let far = origin.neighbor(HexDirection::ENE);

        assert_eq!(origin.distance_to(origin), 0);
        assert_eq!(origin.distance_to(near), 1);
        assert_eq!(origin.distance_to(far), 2);
    }

    #[test]
    fn ring_has_expected_cell_count() {
        let center = HexCoord::zero(1);
        assert_eq!(HexCoord::ring(center, 0).len(), 1);
        assert_eq!(HexCoord::ring(center, 1).len(), 6);
        assert_eq!(HexCoord::ring(center, 2).len(), 12);
    }

    #[test]
    fn pointy_direction_is_more_expensive() {
        assert_eq!(HexDirection::NE.movement_cost(), 1.0);
        assert_eq!(HexDirection::ENE.movement_cost(), 1.5);
    }
}
