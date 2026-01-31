# Stitch 게임 세계 생성 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: 설계 문서 (DESIGN/DETAIL)  
> **참고**: BitCraft Public Doc 5-9, BitCraftServer 구현 소스  

---

## 1. 개요

Stitch 게임의 세계 생성(World Generation)은 프로시저럴(Procedural) 방식으로 hexagonal grid 기반의 지형, 바이옴, 리소스를 생성하는 시스템이다. BitCraft의 아키텍처를 참고하되, Stitch의 요구사항에 맞게 단순화하고 최적화한다.

### 1.1 설계 목표

| 목표 | 설명 |
|------|------|
| **확장성** | 다양한 월드 크기와 바이옴 조합 지원 |
| **재현성** | 동일한 시드로 동일한 월드 생성 (Deterministic) |
| **성능** | 청크 기반 스트리밍, O(1) 연산 최적화 |
| **확장성** | 새로운 바이옴/리소스/구조물의 쉬운 추가 |

---

## 2. 핵심 설계 결정

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| **좌표계** | Axial Coordinates (x, z) + implicit y | 메모리 33% 절약, BitCraft와 동일한 효율성 |
| **셀 해상도** | 단일 해상도 (Terrain = Entity 동일) | Stitch는 더 단순한 게임플레이, 복잡한 다층 불필요 |
| **노이즈 알고리즘** | OpenSimplex Noise | Perlin보다 등방성(isotropic) 우수, 스티칭 아티팩트 없음 |
| **청크 크기** | 32×32 hex cells | 메모리/처리 효율 균형, BitCraft와 동일 |
| **바이옴 매핑** | Diagonal Indexing (O(1) lookup) | 픽셀 기반 바이옴 블렌딩에 최적화 |
| **강 생성** | MST + A* Pathfinding | 모든 호수 연결, 최소 간선 길이 |
| **리소스 배치** | 노이즈 임계값 + 클럼프 시스템 | 자연스러운 군집화, 회전 가능한 다타일 구조물 |

---

## 3. 헥스 그리드 좌표 시스템

### 3.1 좌표 구조

```rust
// Axial Coordinates - y는 암시적 (y = -x - z)
pub struct HexCoordinates {
    pub x: i32,  // q (axial col)
    pub z: i32,  // r (axial row)
}

impl HexCoordinates {
    // Cube coordinates에서 y 계산
    pub fn y(&self) -> i32 {
        -self.x - self.z
    }
    
    // 두 셀 간 거리 (Manhattan distance / 2)
    pub fn distance_to(&self, other: &HexCoordinates) -> i32 {
        let dx = (other.x - self.x).abs();
        let dy = (other.y() - self.y()).abs();
        let dz = (other.z - self.z).abs();
        (dx + dy + dz) / 2
    }
    
    // 특정 방향의 인접 셀 (6방향)
    pub fn neighbor(&self, direction: HexDirection) -> HexCoordinates {
        let (dx, dz) = direction.to_vector();
        HexCoordinates {
            x: self.x + dx,
            z: self.z + dz,
        }
    }
}
```

### 3.2 방향 정의 (6방향 - Flat-Top Hex)

```rust
pub enum HexDirection {
    East,      // (1, 0)
    NorthEast, // (1, -1)
    NorthWest, // (0, -1)
    West,      // (-1, 0)
    SouthWest, // (-1, 1)
    SouthEast, // (0, 1)
}

impl HexDirection {
    pub fn to_vector(&self) -> (i32, i32) {
        match self {
            HexDirection::East => (1, 0),
            HexDirection::NorthEast => (1, -1),
            HexDirection::NorthWest => (0, -1),
            HexDirection::West => (-1, 0),
            HexDirection::SouthWest => (-1, 1),
            HexDirection::SouthEast => (0, 1),
        }
    }
    
    // 시계 방향 회전
    pub fn rotate_clockwise(&self) -> HexDirection {
        match self {
            HexDirection::East => HexDirection::SouthEast,
            HexDirection::SouthEast => HexDirection::SouthWest,
            HexDirection::SouthWest => HexDirection::West,
            HexDirection::West => HexDirection::NorthWest,
            HexDirection::NorthWest => HexDirection::NorthEast,
            HexDirection::NorthEast => HexDirection::East,
        }
    }
}
```

### 3.3 좌표 변환

```rust
// Hex Coordinates ↔ World Position
pub const HEX_OUTER_RADIUS: f32 = 10.0;  // BitCraft: TERRAIN_OUTER_RADIUS
pub const HEX_INNER_RADIUS: f32 = HEX_OUTER_RADIUS * 0.866025404;  // sqrt(3)/2

impl HexCoordinates {
    // 월드 좌표로 변환 (Flat-top hex 기준)
    pub fn to_world_position(&self) -> Vector2 {
        let x = HEX_OUTER_RADIUS * 1.5 * self.x as f32;
        let z = HEX_INNER_RADIUS * 2.0 * (self.z as f32 + self.x as f32 * 0.5);
        Vector2::new(x, z)
    }
    
    // 월드 좌표에서 가장 가까운 hex 셀 찾기
    pub fn from_world_position(pos: Vector2) -> HexCoordinates {
        let x = pos.x / (HEX_OUTER_RADIUS * 1.5);
        let z = (pos.y / (HEX_INNER_RADIUS * 2.0)) - x * 0.5;
        
        let mut cube_x = x.round() as i32;
        let mut cube_z = z.round() as i32;
        let cube_y = (-cube_x - cube_z);
        
        // Cube coordinate 보정 (x + y + z = 0)
        let dx = (x - cube_x as f32).abs();
        let dz = (z - cube_z as f32).abs();
        let dy = ((-x - z) - cube_y as f32).abs();
        
        if dx > dz && dx > dy {
            cube_x = -cube_z - cube_y;
        } else if dz > dy {
            cube_z = -cube_x - cube_y;
        }
        
        HexCoordinates { x: cube_x, z: cube_z }
    }
}
```

### 3.4 오프셋 좌표 (행 기반)

```rust
// Odd-r horizontal layout (행 기반, 홀수행 인덴트)
pub struct OffsetCoordinates {
    pub row: i32,  // z
    pub col: i32,  // x + (z - (z&1)) / 2
}

impl From<HexCoordinates> for OffsetCoordinates {
    fn from(hex: HexCoordinates) -> Self {
        let col = hex.x + (hex.z - (hex.z & 1)) / 2;
        OffsetCoordinates { row: hex.z, col }
    }
}

impl From<OffsetCoordinates> for HexCoordinates {
    fn from(offset: OffsetCoordinates) -> Self {
        let x = offset.col - (offset.row - (offset.row & 1)) / 2;
        HexCoordinates { x, z: offset.row }
    }
}
```

---

## 4. 청크 시스템

### 4.1 청크 구조

```rust
// 청크 크기 상수
pub const CHUNK_WIDTH: usize = 32;
pub const CHUNK_HEIGHT: usize = 32;
pub const CHUNK_SIZE: usize = CHUNK_WIDTH * CHUNK_HEIGHT;  // 1024

// 청크 좌표
pub struct ChunkCoordinates {
    pub x: i32,
    pub z: i32,
    pub dimension: i32,  // 멀티 월드 지원
}

impl ChunkCoordinates {
    // 고유 인덱스 (청크 참조용)
    pub fn to_index(&self) -> i64 {
        (self.dimension as i64) * 1_000_000 
            + (self.z as i64) * 1000 
            + (self.x as i64) + 1
    }
    
    // 월드 좌표 → 청크 좌표
    pub fn from_hex(hex: &HexCoordinates) -> Self {
        ChunkCoordinates {
            x: hex.x.div_euclid(CHUNK_WIDTH as i32),
            z: hex.z.div_euclid(CHUNK_HEIGHT as i32),
            dimension: 0,
        }
    }
    
    // 주변 3×3 청크 가져오기
    pub fn surrounding(&self) -> Vec<ChunkCoordinates> {
        let mut chunks = Vec::with_capacity(9);
        for dz in -1..=1 {
            for dx in -1..=1 {
                chunks.push(ChunkCoordinates {
                    x: self.x + dx,
                    z: self.z + dz,
                    dimension: self.dimension,
                });
            }
        }
        chunks
    }
}
```

### 4.2 지형 셀 구조

```rust
// SpacetimeDB 테이블 - terrain_chunk.rs와 연동
#[spacetimedb(table)]
pub struct TerrainCell {
    #[primary_key]
    pub chunk_id: i64,
    #[primary_key]
    pub cell_index: u16,  // 0..1023
    
    // 좌표
    pub hex_x: i32,
    pub hex_z: i32,
    
    // 지형 데이터
    pub elevation: i16,           // 지형 고도 (-1000 ~ 10000)
    pub water_level: i16,         // 수면 고도 (0 = 바다 레벨)
    pub water_body_type: u8,      // 0:없음, 1:바다, 2:호수, 3:강, 4:늪
    
    // 바이옴
    pub biome_id: u16,            // 바이옴 타입 ID
    pub biome_blend: u8,          // 바이옴 블렌드 팩터 (0-255)
    
    // 특수 속성
    pub vegetation_density: u8,   // 초목 밀도 (0-255)
    pub zoning_type: u8,          // 0:일반, 1:시작지점, 2:금지구역
    
    // 생성 메타데이터
    pub original_elevation: i16,  // 원본 노이즈 고도 (변형 전)
    pub distance_to_water: i16,   // 가장 가까운 물까지 거리
    pub distance_to_sea: i16,     // 가장 가까운 바다까지 거리
}

// 청크 메타데이터
#[spacetimedb(table)]
pub struct TerrainChunk {
    #[primary_key]
    pub id: i64,
    pub dimension: i32,
    pub chunk_x: i32,
    pub chunk_z: i32,
    pub is_generated: bool,
    pub generation_seed: u64,
    pub biome_distribution: Vec<u16>,  // 청크 내 바이옴 비율
}
```

---

## 5. 노이즈 기반 지형 생성

### 5.1 OpenSimplex 노이즈 구현

```rust
pub struct OpenSimplexNoise {
    perm: [i16; 2048],  // Permutation table
    seed: i64,
}

impl OpenSimplexNoise {
    pub fn new(seed: i64) -> Self {
        let mut perm = [0i16; 2048];
        let mut seed = seed;
        
        // LCG (Linear Congruential Generator)로 순열 생성
        for i in 0..2048 {
            seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
            perm[i] = (seed & 2047) as i16;
        }
        
        OpenSimplexNoise { perm, seed }
    }
    
    // 2D 노이즈 샘플링 [-1, 1] 범위
    pub fn sample_2d(&self, x: f64, y: f64) -> f64 {
        // OpenSimplex 2D implementation
        // Stretching and squishing for simplex grid
        const STRETCH: f64 = -0.211324865405187;  // (1/sqrt(3) - 1) / 2
        const SQUISH: f64 = 0.366025403784439;    // (sqrt(3) - 1) / 2
        
        let stretch_offset = (x + y) * STRETCH;
        let xs = x + stretch_offset;
        let ys = y + stretch_offset;
        
        // ... (OpenSimplex core algorithm)
        
        // Normalize to [-1, 1]
        result / 7.69084574549313
    }
}
```

### 5.2 멀티-옥타브 fBm (Fractal Brownian Motion)

```rust
pub struct NoiseSpecs {
    pub seed: i64,
    pub scale: f32,        // 주파수 (낮을수록 큰 특징)
    pub octaves: i32,      // 옥타브 수 (1-8)
    pub persistence: f32,  // 진폭 감쇠 (0.3-0.6)
    pub lacunarity: f32,   // 주파수 증가 (2.0-2.5)
    pub offset: Vector2,
}

pub struct NoiseHelper;

impl NoiseHelper {
    // fBm 노이즈 생성
    pub fn get_fbm(
        x: f32, 
        z: f32, 
        specs: &NoiseSpecs
    ) -> f32 {
        let noise = OpenSimplexNoise::new(specs.seed);
        let mut total = 0.0;
        let mut amplitude = 1.0;
        let mut frequency = 1.0;
        let mut max_value = 0.0;
        
        for _ in 0..specs.octaves {
            let sample_x = (x + specs.offset.x) * specs.scale * frequency;
            let sample_z = (z + specs.offset.y) * specs.scale * frequency;
            
            total += noise.sample_2d(sample_x as f64, sample_z as f64) as f32 * amplitude;
            max_value += amplitude;
            
            amplitude *= specs.persistence;
            frequency *= specs.lacunarity;
        }
        
        // [0, 1] 범위로 정규화
        (total / max_value + 1.0) / 2.0
    }
    
    // 2D 노이즈 맵 생성
    pub fn generate_map(
        width: i32,
        height: i32,
        specs: &NoiseSpecs,
    ) -> Vec<Vec<f32>> {
        let mut map = vec![vec![0.0; height as usize]; width as usize];
        
        for x in 0..width {
            for z in 0..height {
                map[x as usize][z as usize] = Self::get_fbm(x as f32, z as f32, specs);
            }
        }
        
        map
    }
}
```

### 5.3 육지-바다 분리 (Edge Falloff)

```rust
pub struct LandShapeDefinition {
    pub bounds: RectInt,           // 생성 영역
    pub land_threshold: f32,       // 육지/바다 임계값 (0.4-0.6)
    pub noise_specs: NoiseSpecs,   // 기본 노이즈 설정
    pub edge_falloff: f32,         // 가장자리 감쇠 강도 (0.3-0.5)
    pub island_shape: IslandShape, // 섬/대륙 형태
}

pub enum IslandShape {
    Circular { radius: f32 },      // 원형 섬
    Rectangular,                   // 직사각형
    Custom { mask: Vec<Vec<bool>> }, // 커스텀 마스크
}

impl LandShapeDefinition {
    pub fn is_land(&self, x: i32, z: i32, center: Vector2) -> bool {
        let noise_value = NoiseHelper::get_fbm(x as f32, z as f32, &self.noise_specs);
        
        // 중심에서 거리 계산
        let dx = x as f32 - center.x;
        let dz = z as f32 - center.y;
        let distance_sq = dx * dx + dz * dz;
        
        // 가장자리 감쇠 적용: noise - falloff * distance²
        let modified_noise = match self.island_shape {
            IslandShape::Circular { radius } => {
                let normalized_dist = distance_sq / (radius * radius);
                noise_value - self.edge_falloff * normalized_dist
            }
            _ => noise_value,
        };
        
        modified_noise > self.land_threshold
    }
}
```

---

## 6. 바이옴 시스템

### 6.1 바이옴 정의

```rust
pub struct BiomeDefinition {
    pub id: u16,
    pub name: String,
    
    // 고도 커브
    pub distance_to_sea_curve: AnimationCurve,    // 바다 거리에 따른 고도
    pub distance_to_water_curve: AnimationCurve,  // 물 거리에 따른 고도
    pub transition_length: i32,                   // 바이옴 경계 블렌드 폭 (3-5 hex)
    
    // 노이즈 기반 고도 레이어
    pub elevation_layers: Vec<ElevationLayer>,
    pub noise_water_multiplier: AnimationCurve,   // 물 근처 노이즈 감쇠
    
    // 호수/강 설정
    pub max_lake_depth: i16,
    pub lake_noise_specs: NoiseSpecs,
    pub lake_noise_threshold: f32,
    pub lake_depth_multiplier: f32,
    pub lake_sea_barriers: bool,  // 호수-바다 간 댐 생성
    
    // 강 생성 설정
    pub river_settings: Option<RiverSettings>,
    
    // 시각적 속성
    pub vegetation_density: u8,
    pub terracing: bool,          // 테라스 단계화
    pub base_color: Color,
}

pub struct ElevationLayer {
    pub blend_mode: BlendMode,    // Add 또는 Override
    pub threshold: f32,           // 적용 최소 노이즈 값
    pub elevation_range: (i16, i16),  // 결과 고도 범위
    pub noise_specs: NoiseSpecs,
}

pub enum BlendMode {
    Add,      // 누적: elevation += value
    Override, // 대체: elevation = value
}
```

### 6.2 바이옴 맵 정의

```rust
pub struct BiomesMapDefinition {
    pub size: Vector2Int,
    pub pixels: Vec<u8>,  // 각 픽셀은 바이옴 ID (0-127)
    pub step: i32,        // 픽셀당 월드 단위 (STEP = 5)
}

impl BiomesMapDefinition {
    // Diagonal Indexing - O(1) 조회
    pub fn get_biome_at(&self, x: i32, z: i32) -> u8 {
        let step_x = x / self.step;
        let step_z = z / self.step;
        
        // Diagonal index 계산
        let index = if step_x >= step_z {
            (step_x * step_x + step_z) as usize
        } else {
            (step_z * step_z + 2 * step_z + 2 - step_x) as usize
        };
        
        self.pixels.get(index).copied().unwrap_or(0)
    }
    
    // 바이옴 블렌드 값 계산 (0-1)
    pub fn get_biome_blend(&self, x: i32, z: i32, biome_id: u8) -> f32 {
        let center_id = self.get_biome_at(x, z);
        if center_id == biome_id {
            return 1.0;
        }
        
        // 주변 셀 검사하여 블렌드 팩터 계산
        let hex = HexCoordinates { x, z };
        let mut total_distance = 0;
        let mut matching_neighbors = 0;
        
        for dir in HexDirection::all() {
            let neighbor = hex.neighbor(dir);
            let neighbor_id = self.get_biome_at(neighbor.x, neighbor.z);
            if neighbor_id == biome_id {
                matching_neighbors += 1;
            }
            total_distance += 1;
        }
        
        matching_neighbors as f32 / total_distance as f32
    }
}
```

### 6.3 고도 계산 알고리즘

```rust
impl BiomeDefinition {
    pub fn calculate_elevation(
        &self,
        x: i32,
        z: i32,
        distance_to_sea: f32,
        distance_to_water: f32,
        sea_level: i16,
    ) -> i16 {
        // 1. 기본 고도: 바다 거리 커브
        let sea_factor = self.distance_to_sea_curve.evaluate(distance_to_sea);
        let water_factor = self.distance_to_water_curve.evaluate(distance_to_water);
        let base_elevation = sea_level + (sea_factor + water_factor) as i16;
        
        // 2. 노이즈 레이어 적용
        let mut noise_elevation = 0.0;
        let mut noise_divisor = 0.0;
        
        for layer in &self.elevation_layers {
            let noise = NoiseHelper::get_fbm(x as f32, z as f32, &layer.noise_specs);
            
            if noise > layer.threshold {
                // 노이즈 정규화 및 고도 매핑
                let normalized = (noise - layer.threshold) / (1.0 - layer.threshold);
                let min_h = layer.elevation_range.0 as f32;
                let max_h = layer.elevation_range.1 as f32;
                let layer_height = min_h + normalized * (max_h - min_h);
                
                match layer.blend_mode {
                    BlendMode::Add => {
                        noise_elevation += layer_height;
                        noise_divisor += 1.0;
                    }
                    BlendMode::Override => {
                        noise_elevation = layer_height;
                        noise_divisor = 1.0;
                    }
                }
            }
        }
        
        // 3. 물 근처 노이즈 감쇠
        let water_multiplier = self.noise_water_multiplier.evaluate(distance_to_water);
        let final_noise = if noise_divisor > 0.0 {
            (noise_elevation / noise_divisor) * water_multiplier
        } else {
            0.0
        };
        
        // 4. 최종 고도 계산
        let mut elevation = base_elevation + final_noise as i16;
        
        // 5. 테라스 단계화 (옵션)
        if self.terracing {
            elevation = Self::apply_terracing(elevation, sea_level);
        }
        
        elevation.max(0)
    }
    
    fn apply_terracing(elevation: i16, sea_level: i16) -> i16 {
        let above_sea = (elevation - sea_level) as f32;
        
        // 고도에 따른 다른 단계 크기
        let step_size = if above_sea < 16.0 {
            4.0
        } else if above_sea < 32.0 {
            8.0
        } else {
            16.0
        };
        
        let remainder = above_sea % step_size;
        let base = (above_sea / step_size).floor() * step_size;
        
        // 전이 구역 (0.4-0.6)에서는 보간
        let transition_start = step_size * 0.4;
        let transition_end = step_size * 0.6;
        
        let final_above = if remainder < transition_start {
            base
        } else if remainder > transition_end {
            base + step_size
        } else {
            // 선형 보간
            let t = (remainder - transition_start) / (transition_end - transition_start);
            base + t * step_size
        };
        
        sea_level + final_above as i16
    }
}
```

---

## 7. 호수 및 강 생성

### 7.1 호수 생성

```rust
pub fn generate_lakes(
    terrain: &mut HexGraph<TerrainNode>,
    biome: &BiomeDefinition,
    world_seed: i64,
) {
    // 1. 각 셀의 호수 깊이 계산
    for x in 0..terrain.width {
        for z in 0..terrain.depth {
            let hex = HexCoordinates { x: x as i32, z: z as i32 };
            let node = terrain.get_mut(x, z);
            
            if node.terrain_type != TerrainType::Land {
                continue;
            }
            
            // 바이옴 호수 노이즈 샘플링
            let lake_noise = NoiseHelper::get_fbm(
                hex.x as f32, 
                hex.z as f32, 
                &biome.lake_noise_specs
            );
            
            if lake_noise > biome.lake_noise_threshold {
                // 깊이 계산
                let normalized = (lake_noise - biome.lake_noise_threshold) 
                    / (1.0 - biome.lake_noise_threshold);
                let depth = (normalized * biome.lake_depth_multiplier) as i16;
                
                if depth > 0 && depth <= biome.max_lake_depth {
                    node.lake_depth = depth;
                }
            }
        }
    }
    
    // 2. 호수 바닥 평탄화 (flood fill로 연결 영역 찾아 최저점으로 통일)
    flatten_lake_floors(terrain);
    
    // 3. 호수-바다 장벽 생성
    if biome.lake_sea_barriers {
        create_lake_barriers(terrain);
    }
}

fn flatten_lake_floors(terrain: &mut HexGraph<TerrainNode>) {
    // 연결된 호수 영역 찾기
    let lake_areas = find_connected_lake_areas(terrain);
    
    for area in lake_areas {
        // 각 영역의 최저 고도 찾기
        let min_elevation = area.iter()
            .map(|(x, z)| terrain.get(*x, *z).elevation)
            .min()
            .unwrap_or(0);
        
        // 영역 내 모든 셀을 최저점으로 설정
        for (x, z) in area {
            let node = terrain.get_mut(x, z);
            node.elevation = min_elevation;
            node.water_level = min_elevation;  // 가득 찬 호수
        }
    }
}
```

### 7.2 강 생성 (MST + A*)

```rust
pub struct RiverSettings {
    pub width: i32,                      // 강 폭 (hex 셀)
    pub depth_curve: AnimationCurve,     // 강 단면도 깊이 커브
    pub erosion: f32,                    // 침식 계수 (0-1)
    pub min_lake_circumference: i32,     // 최소 호수 둘레 (강 생성 최소 크기)
    pub pathfinding_costs: Vec<RiverCost>,
}

pub struct RiverCost {
    pub elevation_range: (i16, i16),  // 고도 차 범위
    pub cost: f32,                     // 해당 범위의 이동 비용
}

pub fn generate_rivers(
    terrain: &mut HexGraph<TerrainNode>,
    settings: &RiverSettings,
) {
    // 1. 모든 호수 찾기
    let lakes = find_lakes(terrain, settings.min_lake_circumference);
    
    // 2. 모든 호수 쌍 간 최단 경로 계산
    let mut river_candidates = Vec::new();
    
    for i in 0..lakes.len() {
        for j in (i + 1)..lakes.len() {
            let start = find_lowest_border_cell(&lakes[i], terrain);
            let end = find_lowest_border_cell(&lakes[j], terrain);
            
            // A*로 최단 경로 계산 (고도 기반 비용)
            let path = find_river_path(start, end, terrain, settings);
            let total_cost = calculate_path_cost(&path, terrain, settings);
            
            river_candidates.push(RiverCandidate {
                from: i,
                to: j,
                path,
                cost: total_cost,
            });
        }
    }
    
    // 3. Kruskal MST로 최소 연결집합 선택
    let selected_rivers = kruskal_mst(&lakes, &river_candidates);
    
    // 4. 선택된 강 적용
    for river in selected_rivers {
        apply_river(&river.path, terrain, settings);
    }
}

fn find_river_path(
    start: HexCoordinates,
    end: HexCoordinates,
    terrain: &HexGraph<TerrainNode>,
    settings: &RiverSettings,
) -> Vec<HexCoordinates> {
    // A* pathfinding
    let mut open_set = BinaryHeap::new();
    let mut came_from = HashMap::new();
    let mut g_score = HashMap::new();
    
    open_set.push(Reverse((0, start)));
    g_score.insert(start, 0.0);
    
    while let Some(Reverse((_, current))) = open_set.pop() {
        if current == end {
            // 경로 재구성
            return reconstruct_path(came_from, current);
        }
        
        for neighbor in current.neighbors() {
            let current_node = terrain.get_at(current.x, current.z);
            let neighbor_node = terrain.get_at(neighbor.x, neighbor.z);
            
            // 고도 차에 따른 이동 비용
            let elevation_diff = (neighbor_node.elevation - current_node.elevation).abs();
            let move_cost = settings.pathfinding_costs.iter()
                .find(|c| elevation_diff >= c.elevation_range.0 
                    && elevation_diff <= c.elevation_range.1)
                .map(|c| c.cost)
                .unwrap_or(100.0);
            
            let tentative_g = g_score[&current] + move_cost;
            
            if tentative_g < *g_score.get(&neighbor).unwrap_or(&f32::INFINITY) {
                came_from.insert(neighbor, current);
                g_score.insert(neighbor, tentative_g);
                
                // f = g + h (heuristic = hex distance)
                let h = neighbor.distance_to(&end) as f32;
                open_set.push(Reverse((tentative_g + h, neighbor)));
            }
        }
    }
    
    Vec::new()  // 경로 없음
}

fn apply_river(
    path: &[HexCoordinates],
    terrain: &mut HexGraph<TerrainNode>,
    settings: &RiverSettings,
) {
    for (i, hex) in path.iter().enumerate() {
        let node = terrain.get_mut_at(hex.x, hex.z);
        
        // 강 폭 적용
        let progress = i as f32 / path.len() as f32;
        let depth = settings.depth_curve.evaluate(progress);
        
        // 침식 적용
        let eroded_elevation = node.elevation as f32 * (1.0 - settings.erosion);
        node.elevation = eroded_elevation as i16;
        
        // 수면 설정 (강 = flowing water)
        node.water_level = node.elevation;
        node.water_body_type = WaterBodyType::River;
        node.river_depth = depth as i16;
    }
}
```

---

## 8. 리소스(자원) 생성

### 8.1 리소스 정의

```rust
pub struct ResourceDefinition {
    pub id: u32,
    pub name: String,
    pub resource_type: ResourceType,
    pub details: ResourceDetails,
    pub biome_spawns: Vec<ResourceBiomeSpawn>,
}

pub struct ResourceDetails {
    pub clump_id: i32,               // 클럼프(군집) ID - 함께 생성되는 리소스 그룹
    pub spawns_on_land: bool,
    pub land_elevation_range: (i16, i16),  // 허용 육지 고도 범위
    pub spawns_in_water: bool,
    pub water_depth_range: (i16, i16),     // 허용 수심 범위
    pub spawns_on_uneven: bool,      // 울퉁불퉁한 지형에도 생성
    pub requires_flat_area: bool,    // 평평한 영역 필요
    pub footprint: Vec<HexDirection>, // 차지하는 셀 상대 위치 (히트박스)
    pub perimeter: Vec<HexDirection>, // 차단 영역 (건설 금지)
}

pub struct ResourceBiomeSpawn {
    pub biome_id: u16,
    pub spawn_chance: f32,           // 0-1 스폰 확률
    pub noise_threshold: (f32, f32), // 노이즈 값 범위 [min, max]
    pub noise_specs: NoiseSpecs,     // 배치용 노이즈 설정
}

pub enum ResourceType {
    Tree,        // 나무 (재생 가능)
    Rock,        // 암석
    OreDeposit,  // 광석 매장지
    Plant,       // 수확 가능 식물
    Structure,   // 고정 구조물
}
```

### 8.2 리소스 생성 알고리즘

```rust
pub fn generate_resources(
    ctx: &ReducerContext,
    world_def: &WorldDefinition,
    terrain: &HexGraph<TerrainNode>,
    entities: &mut HexGraph<EntityNode>,
) {
    // 기존 리소스 초기화
    clear_existing_resources(ctx);
    
    // 클럼프 ID별로 리소스 그룹화
    let resources_by_clump = group_resources_by_clump(&world_def.resources);
    
    for (clump_id, resources) in resources_by_clump {
        // 각 리소스 타입별로 처리
        for resource in resources {
            // 이 리소스가 스폰될 수 있는 바이옴 필터링
            let valid_biomes: Vec<_> = resource.biome_spawns.iter()
                .filter(|b| b.spawn_chance > 0.0)
                .collect();
            
            if valid_biomes.is_empty() {
                continue;
            }
            
            // 바이옴별로 개별 RNG 시드 초기화
            for biome_spawn in valid_biomes {
                let seed = world_def.seed 
                    + resource.id as i64 * 1000 
                    + biome_spawn.biome_id as i64;
                let mut rng = SeededRng::new(seed);
                
                // 모든 엔티티 노드 검사
                for x in 0..entities.width {
                    for z in 0..entities.depth {
                        let hex = HexCoordinates { x: x as i32, z: z as i32 };
                        
                        // 노드 유효성 검사
                        if !is_valid_resource_node(
                            &hex, entities, terrain, resource, biome_spawn, &mut rng
                        ) {
                            continue;
                        }
                        
                        // 클럼프 방향 결정 (6방향 중 하나)
                        let directions = HexDirection::all();
                        let facing = directions[rng.next_u32() as usize % 6];
                        
                        // 풋프린트(차지 영역) 유효성 검사
                        if !is_valid_resource_footprint(
                            &hex, facing, resource, entities, terrain
                        ) {
                            continue;
                        }
                        
                        // 리소스 배치
                        place_resource_clump(
                            ctx, &hex, facing, resource, entities
                        );
                    }
                }
            }
        }
    }
}

fn is_valid_resource_node(
    hex: &HexCoordinates,
    entities: &HexGraph<EntityNode>,
    terrain: &HexGraph<TerrainNode>,
    resource: &ResourceDefinition,
    biome_spawn: &ResourceBiomeSpawn,
    rng: &mut SeededRng,
) -> bool {
    // 1. 이미 점유된 노드인지 확인
    let entity_node = entities.get_at(hex.x, hex.z);
    if entity_node.has_building || entity_node.has_resource {
        return false;
    }
    
    // 2. 연결된 지형 노드 가져오기
    let terrain_coords = hex.to_terrain_scale();
    let terrain_node = terrain.get_at(terrain_coords.x, terrain_coords.z);
    
    // 3. 바이옴 체크
    let biome_blend = get_biome_blend_at(hex, biome_spawn.biome_id);
    if biome_blend <= 0.0 {
        return false;
    }
    
    // 4. 육지/물 체크
    if resource.details.spawns_on_land {
        let elevation_above_water = terrain_node.elevation - terrain_node.water_level;
        let (min_elev, max_elev) = resource.details.land_elevation_range;
        if elevation_above_water < min_elev || elevation_above_water > max_elev {
            return false;
        }
    }
    
    if resource.details.spawns_in_water {
        let water_depth = terrain_node.water_level - terrain_node.elevation;
        let (min_depth, max_depth) = resource.details.water_depth_range;
        if water_depth < min_depth || water_depth > max_depth {
            return false;
        }
    }
    
    // 5. 평탄도 체크
    if !resource.details.spawns_on_uneven {
        // 주변 고도 확인
        let mut is_uneven = false;
        for neighbor_dir in HexDirection::all() {
            let neighbor = hex.neighbor(neighbor_dir);
            let neighbor_coords = neighbor.to_terrain_scale();
            let neighbor_node = terrain.get_at(neighbor_coords.x, neighbor_coords.z);
            
            if (neighbor_node.elevation - terrain_node.elevation).abs() > 2 {
                is_uneven = true;
                break;
            }
        }
        if is_uneven {
            return false;
        }
    }
    
    // 6. 노이즈 기반 확률 체크
    let noise = NoiseHelper::get_fbm(
        hex.x as f32, 
        hex.z as f32, 
        &biome_spawn.noise_specs
    );
    let (min_thresh, max_thresh) = biome_spawn.noise_threshold;
    if noise < min_thresh || noise > max_thresh {
        return false;
    }
    
    // 7. 최종 확률 체크
    let final_chance = biome_spawn.spawn_chance * biome_blend;
    rng.next_f32() < final_chance
}

fn is_valid_resource_footprint(
    origin: &HexCoordinates,
    facing: HexDirection,
    resource: &ResourceDefinition,
    entities: &HexGraph<EntityNode>,
    terrain: &HexGraph<TerrainNode>,
) -> bool {
    // 히트박스 + 퍼리미터의 모든 셀 검사
    let all_cells: Vec<_> = resource.details.footprint.iter()
        .chain(resource.details.perimeter.iter())
        .map(|rel_dir| {
            // facing 방향 기준으로 상대 위치 회전
            let rotated_dir = rotate_direction(*rel_dir, facing);
            origin.neighbor(rotated_dir)
        })
        .collect();
    
    for hex in all_cells {
        // 월드 경계 체크
        if hex.x < 0 || hex.x >= entities.width as i32 
            || hex.z < 0 || hex.z >= entities.depth as i32 {
            return false;
        }
        
        // 점유 여부 체크
        let node = entities.get_at(hex.x, hex.z);
        if node.has_building || node.has_resource {
            return false;
        }
        
        // 지형 유효성 체크
        let terrain_coords = hex.to_terrain_scale();
        if terrain_coords.x < 0 || terrain_coords.x >= terrain.width as i32
            || terrain_coords.z < 0 || terrain_coords.z >= terrain.depth as i32 {
            return false;
        }
    }
    
    true
}

fn place_resource_clump(
    ctx: &ReducerContext,
    origin: &HexCoordinates,
    facing: HexDirection,
    resource: &ResourceDefinition,
    entities: &mut HexGraph<EntityNode>,
) {
    // 히트박스에 리소스 배치 (수확/채굴 가능)
    for rel_dir in &resource.details.footprint {
        let rotated_dir = rotate_direction(*rel_dir, facing);
        let hex = origin.neighbor(rotated_dir);
        
        // 엔티티 노드 업데이트
        let node = entities.get_mut_at(hex.x, hex.z);
        node.has_resource = true;
        node.resource_id = resource.id;
        
        // SpacetimeDB에 리소스 노드 생성
        ctx.db.resource_node().insert(ResourceNode {
            id: ctx.db.resource_node().next_id(),
            hex_x: hex.x,
            hex_z: hex.z,
            resource_def_id: resource.id,
            clump_id: resource.details.clump_id,
            facing: facing as u8,
            amount: calculate_initial_amount(resource),
            max_amount: calculate_max_amount(resource),
            respawn_timer: None,
        });
    }
    
    // 퍼리미터는 차단 영역만 표시 (건설 금지)
    for rel_dir in &resource.details.perimeter {
        let rotated_dir = rotate_direction(*rel_dir, facing);
        let hex = origin.neighbor(rotated_dir);
        
        let node = entities.get_mut_at(hex.x, hex.z);
        node.is_blocked = true;
    }
}
```

---

## 9. 월드 생성 파이프라인

### 9.1 전체 흐름

```rust
pub struct WorldGenerator;

impl WorldGenerator {
    pub fn generate(world_def: &WorldDefinition) -> GeneratedWorld {
        // Phase 1: 지형 그래프 생성
        let mut terrain_graph = create_terrain_graph(world_def);
        generate_terrain(&mut terrain_graph, world_def);
        
        // Phase 2: 엔티티 그래프 생성 (3x 해상도)
        let mut entity_graph = create_entity_graph(world_def);
        
        // Phase 3: 구조물 배치
        generate_buildings(&mut entity_graph, world_def);
        
        // Phase 4: 리소스 생성
        generate_resources(&mut entity_graph, &terrain_graph, world_def);
        
        // Phase 5: 청크 상태 생성
        let chunks = generate_chunks(&terrain_graph, &entity_graph, world_def);
        
        GeneratedWorld {
            chunks,
            terrain_graph,
            entity_graph,
        }
    }
}
```

### 9.2 지형 생성 단계

```rust
fn generate_terrain(
    graph: &mut HexGraph<TerrainNode>,
    world_def: &WorldDefinition,
) {
    // Step 1: 지형 타입 분류 (육지/바다/호수)
    classify_terrain_types(graph, &world_def.land_shape);
    
    // Step 2: 거리 필드 계산
    compute_distance_fields(graph);
    
    // Step 3: 고도 계산 (바이옴 + 산맥 + 노이즈)
    calculate_elevation(graph, world_def);
    
    // Step 4: 물 레벨 설정
    calculate_water_levels(graph, world_def.sea_level);
    
    // Step 5: 노이즈 기반 호수 생성
    for biome in &world_def.biomes {
        generate_lakes(graph, biome, world_def.seed);
    }
    
    // Step 6: 강 생성 (MST + A*)
    for biome in &world_def.biomes {
        if let Some(ref river_settings) = biome.river_settings {
            generate_rivers(graph, river_settings);
        }
    }
    
    // Step 7: 최종 물 고도 조정
    finalize_water_elevation(graph);
}

fn compute_distance_fields(graph: &mut HexGraph<TerrainNode>) {
    // 바다까지 거리 (flood fill from all sea cells)
    let sea_cells: Vec<_> = graph.iter()
        .filter(|(_, node)| node.terrain_type == TerrainType::Sea)
        .map(|(idx, _)| idx)
        .collect();
    
    graph.distance_to(
        &sea_cells,
        |node| node.terrain_type == TerrainType::Sea,
        |node, dist| node.distance_to_sea = dist,
    );
    
    // 물(바다/호수/강)까지 거리
    let water_cells: Vec<_> = graph.iter()
        .filter(|(_, node)| node.water_level > node.elevation)
        .map(|(idx, _)| idx)
        .collect();
    
    graph.distance_to(
        &water_cells,
        |node| node.water_level > node.elevation,
        |node, dist| node.distance_to_water = dist,
    );
}
```

---

## 10. 성능 최적화

### 10.1 메모리 최적화

| 기법 | 설명 | 효과 |
|------|------|------|
| **Axial Coordinates** | y 암시적 저장 | 33% 메모리 절약 |
| **청크 단위 처리** | 32×32 단위 생성/로드 | 캐시 효율, 스트리밍 |
| **단일 해상도** | Terrain = Entity 통일 | 메모리/계산 단순화 |
| **Distance Field 캐싱** | 사전 계산된 거리 | 실시간 연산 감소 |
| **Diagonal Indexing** | O(1) 바이옴 조회 | 조회 시간 상수화 |

### 10.2 생성 성능 최적화

```rust
// 병렬 청크 생성
pub fn generate_chunks_parallel(
    world_def: &WorldDefinition,
    chunk_coords: Vec<ChunkCoordinates>,
) -> Vec<TerrainChunk> {
    chunk_coords.par_iter().map(|coord| {
        // 각 청크 독립적으로 생성 (deterministic)
        let chunk_seed = world_def.seed + coord.to_index();
        generate_single_chunk(world_def, coord, chunk_seed)
    }).collect()
}

// 지연 로딩 (Lazy Generation)
pub struct ChunkCache {
    loaded_chunks: LruCache<i64, TerrainChunk>,
    generation_queue: VecDeque<ChunkCoordinates>,
}

impl ChunkCache {
    pub fn get_chunk(&mut self, coord: ChunkCoordinates) -> Option<&TerrainChunk> {
        let index = coord.to_index();
        
        if let Some(chunk) = self.loaded_chunks.get(&index) {
            return Some(chunk);
        }
        
        // 없으면 큐에 추가 (비동기 생성)
        self.generation_queue.push_back(coord);
        None
    }
}
```

---

## 11. SpacetimeDB 통합

### 11.1 테이블 스키마

```rust
// terrain_chunk.rs에 정의된 테이블과 연동
#[spacetimedb(table)]
pub struct TerrainChunk {
    #[primary_key]
    pub chunk_id: i64,
    pub dimension_id: u32,
    pub chunk_x: i32,
    pub chunk_z: i32,
    pub cells: Vec<TerrainCell>,  // 1024개 셀
    pub is_generated: bool,
    pub last_accessed: Timestamp,
}

#[spacetimedb(table)]
pub struct ResourceNode {
    #[primary_key]
    pub id: u64,
    pub hex_x: i32,
    pub hex_z: i32,
    pub chunk_id: i64,  // 인덱싱용
    pub resource_def_id: u32,
    pub clump_id: i32,
    pub facing: u8,  // 0-5
    pub current_amount: u32,
    pub max_amount: u32,
    pub is_depleted: bool,
    pub respawn_at: Option<Timestamp>,
}

#[spacetimedb(table)]
pub struct WorldGenParams {
    #[primary_key]
    pub id: u32,
    pub seed: u64,
    pub world_size: (i32, i32),  // 청크 단위
    pub sea_level: i16,
    pub biome_definitions: Vec<BiomeDefinition>,
    pub resource_definitions: Vec<ResourceDefinition>,
}
```

### 11.2 리듀서 인터페이스

```rust
#[spacetimedb(reducer)]
pub fn generate_world(
    ctx: &ReducerContext,
    seed: u64,
    size_chunks: (i32, i32),
) {
    // 월드 생성 파라미터 저장
    ctx.db.world_gen_params().insert(WorldGenParams {
        id: 0,
        seed,
        world_size: size_chunks,
        ..default_params()
    });
    
    // 월드 생성 실행
    let world_def = WorldDefinition::from_db(ctx);
    let generated = WorldGenerator::generate(&world_def);
    
    // 결과를 SpacetimeDB에 저장
    for chunk in generated.chunks {
        ctx.db.terrain_chunk().insert(chunk);
    }
    
    for resource in generated.resources {
        ctx.db.resource_node().insert(resource);
    }
}

#[spacetimedb(reducer)]
pub fn get_chunk_data(
    ctx: &ReducerContext,
    chunk_x: i32,
    chunk_z: i32,
) -> Option<TerrainChunk> {
    let chunk_id = ChunkCoordinates::new(chunk_x, chunk_z).to_index();
    ctx.db.terrain_chunk().chunk_id().find(chunk_id)
}

#[spacetimedb(reducer)]
pub fn harvest_resource(
    ctx: &ReducerContext,
    resource_id: u64,
    player_id: u64,
    amount: u32,
) -> Result<ResourceHarvestResult, Error> {
    let mut resource = ctx.db.resource_node()
        .id()
        .find(resource_id)
        .ok_or(Error::ResourceNotFound)?;
    
    if resource.is_depleted {
        return Err(Error::ResourceDepleted);
    }
    
    let actual_amount = amount.min(resource.current_amount);
    resource.current_amount -= actual_amount;
    
    if resource.current_amount == 0 {
        resource.is_depleted = true;
        // 재생성 타이머 설정
        let respawn_time = calculate_respawn_time(resource.resource_def_id);
        resource.respawn_at = Some(ctx.timestamp + respawn_time);
    }
    
    ctx.db.resource_node().id().update(resource);
    
    // 인벤토리에 추가
    add_to_inventory(ctx, player_id, resource.resource_def_id, actual_amount)?;
    
    Ok(ResourceHarvestResult {
        harvested: actual_amount,
        remaining: resource.current_amount,
    })
}
```

---

## 12. 구현 체크리스트

### Phase 1: 핵심 좌표 시스템
- [ ] HexCoordinates 구조체 (axial coordinates)
- [ ] HexDirection enum (6방향)
- [ ] 좌표 변환 (world position ↔ hex)
- [ ] ChunkCoordinates 및 인덱싱
- [ ] Chunk ↔ Hex 변환

### Phase 2: 노이즈 시스템
- [ ] OpenSimplexNoise 구현
- [ ] NoiseSpecs 구조체
- [ ] fBm (Fractal Brownian Motion) 합성
- [ ] 노이즈 맵 생성 (2D 배열)
- [ ] 쓰레드 로컬 캐싱

### Phase 3: 지형 생성
- [ ] TerrainNode 구조체
- [ ] HexGraph<T> 제네릭 그래프
- [ ] LandShapeDefinition (육지/바다 분리)
- [ ] Distance field 계산 (flood fill)
- [ ] Elevation calculation (바이옴 커브)

### Phase 4: 바이옴 시스템
- [ ] BiomeDefinition 구조체
- [ ] ElevationLayer (Add/Override 블렌딩)
- [ ] BiomesMapDefinition (diagonal indexing)
- [ ] 바이옴 블렌딩 계산
- [ ] 테라스 단계화 (terracing)

### Phase 5: 수계 생성
- [ ] Lake generation (noise-based)
- [ ] Flood fill 연결 영역 탐지
- [ ] Lake floor flattening
- [ ] River pathfinding (A*)
- [ ] MST (Kruskal)로 최소 연결
- [ ] River application (erosion)

### Phase 6: 리소스 생성
- [ ] ResourceDefinition 구조체
- [ ] ResourceBiomeSpawn 설정
- [ ] Clump system (다타일 구조물)
- [ ] Footprint validation
- [ ] Placement rotation (6방향 시도)

### Phase 7: SpacetimeDB 통합
- [ ] TerrainChunk 테이블
- [ ] TerrainCell 테이블
- [ ] ResourceNode 테이블
- [ ] generate_world 리듀서
- [ ] get_chunk_data 리듀서
- [ ] harvest_resource 리듀서

### Phase 8: 최적화
- [ ] 청크 단위 병렬 생성
- [ ] LRU 청크 캐싱
- [ ] 지연 로딩 (lazy generation)
- [ ] Distance field 캐싱
- [ ] 메모리 사용량 최적화

---

## 13. 참고 자료

### BitCraft 문서 참고
- `5-hex-grid-coordinate-system.md` - 헥스 좌표계
- `6-world-generator-architecture.md` - 생성 아키텍처
- `7-noise-based-terrain-elevation.md` - 노이즈 고도
- `8-biome-and-resource-distribution.md` - 바이옴/리소스
- `9-resource-deposit-generation.md` - 리소스 생성

### BitCraftServer 구현 참고
- `packages/game/src/game/world_gen/` - 전체 모듈
- `packages/game/src/game/coordinates/` - 좌표 시스템
- `packages/game/src/game/world_gen/world_generation/` - 그래프/노드
- `packages/game/src/game/world_gen/open_simplex_noise.rs` - 노이즈

### Stitch 설계 참고
- `DESIGN/05-data-model-tables/terrain_chunk.md` - 청크 테이블
- `DESIGN/05-data-model-tables/resource_node.md` - 리소스 테이블
- `DESIGN/05-data-model-tables/resource_state.md` - 리소스 상태

---

## 14. 용어 정의

| 용어 | 설명 |
|------|------|
| **Hex/Hexagonal** | 육각형 그리드 셀 |
| **Axial Coordinates** | (x, z) 두 값으로 표현하는 헥스 좌표 (y는 암시적) |
| **Cube Coordinates** | (x, y, z) 세 값으로 표현하는 헥스 좌표 (x+y+z=0) |
| **Chunk** | 32×32 hex 셀로 구성된 월드의 하위 영역 |
| **Biome** | 특정 기후/지형 특성을 가진 영역 (숲, 사막, 산 등) |
| **fBm** | Fractal Brownian Motion - 멀티-옥타브 노이즈 합성 |
| **Clump** | 함께 생성되는 다타일 리소스 그룹 |
| **Footprint** | 리소스가 차지하는 셀 영역 |
| **MST** | Minimum Spanning Tree - 최소 연결 트리 |
