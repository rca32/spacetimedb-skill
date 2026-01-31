# Stitch 게임 건축 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: 설계 문서 (DESIGN/DETAIL)  
> **참고**: BitCraft Public Doc 16, 22, 27 / BitCraftServer 구현 소스

---

## 1. 개요

Stitch 게임의 건축 시스템은 플레이어가 세계에 구조물을 배치하고 건설하며 관리하는 핵심 시스템이다. BitCraft의 2단계 건설 패턴(Project Site → Building)과 Footprint 기반 충돌 검사, 권한 시스템을 참고하되 Stitch의 Cozy MMO 특성에 맞게 단순화하고 확장한다.

### 1.1 설계 목표

| 목표 | 설명 |
|------|------|
| **직관성** | 명확한 배치/건설/완공 흐름, 시각적 피드백 |
| **협업** | 다수 플레이어의 공동 건설 지원 |
| **유연성** | 회전, 이동, 철거 등 건축물 수정 기능 |
| **경제성** | 유지비/감가 시스템으로 장기적 경제 균형 |
| **확장성** | 새로운 건축물 타입의 쉬운 추가 |

### 1.2 핵심 설계 결정

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| **좌표계** | Hex Coordinates (Axial x, z) | 기존 월드 생성 시스템과 통일 |
| **건설 패턴** | 2단계: Project Site → Building | BitCraft 검증된 패턴, 협업 가능 |
| **배치 검증** | Footprint + Perimeter 타일 | 충돌/권한/지형 종합 검사 |
| **권한 계층** | Player → Party → Guild → Public | 기존 permission_state 재활용 |
| **유지/감가** | Claim 기반 공급 소비 | 영토 관리와 연계된 경제 시스템 |

---

## 2. 핵심 개념

### 2.1 건축 생애주기

```
[설계/배치] → [프로젝트 사이트 생성] → [자재 투입] → [건설 진행] → [완공] → [유지/수리] → [철거]
     ↑                                                                              ↓
     └───────────────────────── [이동/수정] ←───────────────────────────────────────┘
```

### 2.2 타일 유형 (Footprint Types)

| 타입 | 설명 | 상호작용 |
|------|------|----------|
| **Hitbox** | 건축물 물리적 충돌 영역 | 통과 불가, 공격 대상 |
| **Walkable** | 건축물 내부 이동 가능 | 입장/퇴장, 내부 상호작용 |
| **Decorative** | 시각적 장식 타일 | 통과 가능, 충돌 없음 |
| **Perimeter** | 배치 시 차단 영역 | 다른 건축/자원 배치 금지 |
| **Interaction** | 상호작용 포인트 | 사용/조작 가능 지점 |

### 2.3 건축물 카테고리

| 카테고리 | 예시 | 특성 |
|----------|------|------|
| **Foundation** | 토대, 바닥 | 다른 건축물의 기초로 사용 |
| **Wall** | 벽, 울타리 | 방어/구획 분리 |
| **Door** | 문, 게이트 | Walkable + 상호작용 |
| **Storage** | 상자, 창고 | 인벤토리 기능 |
| **Crafting** | 작업대, 화로 | 제작/가공 기능 |
| **Housing** | 집, 텐트 | 인테리어/거주 공간 |
| **Claim** | 클레임 토템 | 영토 선점/관리 |
| **Decoration** | 가구, 조명 | 미관/분위기 |
| **Resource** | 농장, 광맥 | 자원 생산/채집 |

---

## 3. 데이터 모델

### 3.1 Building Definition (정적 데이터)

```rust
// building_def.rs - 정적 데이터 (SpacetimeDB 비저장)
pub struct BuildingDef {
    pub id: u32,
    pub name: String,
    pub category: BuildingCategory,
    pub description: String,
    
    // Footprint 정의 (상대 좌표)
    pub footprint: Vec<FootprintTile>,
    pub perimeter: Vec<HexDirection>,  // 배치 금지 영역
    
    // 건설 레시피
    pub construction: ConstructionRecipe,
    
    // 철거/이동 설정
    pub deconstruction: DeconstructionRecipe,
    pub can_move: bool,
    pub move_cost: Vec<ItemStack>,
    
    // 기능 설정
    pub functions: Vec<BuildingFunction>,
    pub max_durability: u32,
    pub maintenance_cost: MaintenanceCost,
    
    // 상호작용 설정
    pub interaction_level: InteractionLevel,  // All/Party/Guild/Private
    pub enterable: bool,  // 인테리어 존재 여부
    
    // 배치 제약
    pub placement_constraints: PlacementConstraints,
}

pub struct FootprintTile {
    pub relative_x: i8,  // 중심으로부터 상대 좌표
    pub relative_z: i8,
    pub tile_type: TileType,  // Hitbox/Walkable/Decorative/Interaction
    pub height: i16,  // 고도 오프셋
}

pub enum BuildingCategory {
    Foundation, Wall, Door, Storage(u32),  // 슬롯 수
    Crafting(Vec<CraftingStationType>),
    Housing { max_occupants: u8 },
    Claim { base_radius: u8 },
    Decoration,
    Resource { resource_type: ResourceType, output_rate: u32 },
}

pub struct ConstructionRecipe {
    pub required_materials: Vec<ItemStack>,
    pub required_actions: u32,  // 완료까지 필요한 건설 행동 수
    pub action_stamina_cost: u32,
    pub required_tool: Option<ToolType>,
    pub base_progress_per_action: f32,  // 기본 진행률 (0.0-1.0)
    pub skill_bonus: SkillBonus,  // 스킬 레벨에 따른 진행률 보너스
    pub instant_build: bool,  // 즉시 완성 (작은 장식물 등)
}

pub struct DeconstructionRecipe {
    pub refund_materials: Vec<ItemStack>,  // 반환 재료 (보통 50-100%)
    pub requires_tool: Option<ToolType>,
    pub refund_inventory: bool,  // 내부 인벤토리 반환 여부
}

pub struct MaintenanceCost {
    pub supply_consumption_per_hour: u32,  // 클레임 공급 소비량
    pub durability_decay_per_hour: u32,    // 공급 부족 시 감가량
    pub repair_cost_multiplier: f32,       // 수리 비용 계수
}

pub enum InteractionLevel {
    All,      // 누구나 상호작용
    Party,    // 파티 멤버만
    Guild,    // 길드 멤버만
    Owner,    // 소유자만
}

pub struct PlacementConstraints {
    pub requires_flat_surface: bool,
    pub max_slope: i16,  // 최대 허용 경사
    pub requires_paving: bool,  // 포장된 지형 필요
    pub forbidden_biomes: Vec<u16>,  // 배치 불가 바이옴
    pub min_distance_to_claim: i32,  // 다른 클레임과 최소 거리
    pub allowed_dimensions: Vec<i32>,  // 허용 차원 (0=overworld, 1+=interior)
    pub corner_cell_only: bool,  // Hex 코너 셀에만 배치
}
```

### 3.2 Project Site State (건설 중)

```rust
// project_site_state.rs
#[spacetimedb::table(name = project_site_state, public)]
pub struct ProjectSiteState {
    #[primary_key]
    pub entity_id: u64,
    
    // 배치 정보
    pub building_def_id: u32,
    pub owner_id: u64,
    pub claim_id: Option<u64>,  // 소속 클레임
    
    // 위치/방향
    pub hex_x: i32,
    pub hex_z: i32,
    pub facing: u8,  // 0-5 방향 (HexDirection)
    pub dimension_id: u32,
    
    // 건설 진행
    pub current_actions: u32,  // 현재까지 수행된 행동 수
    pub total_actions: u32,    // 총 필요 행동 수
    pub materials_contributed: Vec<ContributedMaterial>,
    pub contributors: Vec<ContributorInfo>,  // 기여자 목록 (경험치/평판 분배용)
    
    // 상태
    pub created_at: Timestamp,
    pub last_progress_at: Timestamp,
    pub is_abandoned: bool,  // 장기 미진행 시 폐기 예정
}

pub struct ContributedMaterial {
    pub item_def_id: u32,
    pub quantity: u32,
    pub contributed_by: u64,  // 플레이어 ID
}

pub struct ContributorInfo {
    pub player_id: u64,
    pub actions_performed: u32,
    pub materials_contributed: Vec<ItemStack>,
}
```

### 3.3 Building State (완성된 건축물)

```rust
// building_state.rs - 기존 테이블 확장
#[spacetimedb::table(name = building_state, public)]
pub struct BuildingState {
    #[primary_key]
    pub entity_id: u64,
    
    // 정적 참조
    pub building_def_id: u32,
    pub owner_id: u64,
    pub claim_id: Option<u64>,
    pub constructed_by: Option<u64>,  // 최종 완성자
    
    // 위치
    pub hex_x: i32,
    pub hex_z: i32,
    pub facing: u8,
    pub dimension_id: u32,
    
    // 내구도/상태
    pub current_durability: u32,
    pub max_durability: u32,
    pub state: BuildingStateEnum,
    
    // 기능 상태
    pub last_maintenance_at: Timestamp,
    pub is_active: bool,  // 기능 사용 가능 여부
    pub nickname: Option<String>,  // 플레이어 지정 이름
    
    // 인테리어 (Housing/Storage 등)
    pub interior_instance_id: Option<u64>,  // 연결된 인스턴스 차원
}

pub enum BuildingStateEnum {
    Normal,      // 정상
    Damaged,     // 손상 (수리 필요)
    Broken,      // 파손 (기능 불가)
    Decaying,    // 방치 감가 중
}

// 기존 building_state.md와 호환되는 뷰
// durability 필드를 current_durability/max_durability로 확장
```

### 3.4 Building Footprint (런타임 타일)

```rust
// building_footprint.rs - 실제 배치된 타일 추적
#[spacetimedb::table(name = building_footprint, public)]
pub struct BuildingFootprint {
    #[primary_key]
    pub tile_id: u64,  // 고유 ID
    
    // 위치 (복합 인덱스)
    pub hex_x: i32,
    pub hex_z: i32,
    pub dimension_id: u32,
    
    // 소속 건축물
    pub building_entity_id: u64,
    pub tile_type: TileType,
    pub is_perimeter: bool,  // 배치 금지 영역인지
    
    // 상호작용 데이터
    pub interaction_id: Option<u64>,  // 상호작용 포인트 ID
}

pub enum TileType {
    Hitbox,       // 물리적 충돌
    Walkable,     // 이동 가능
    Decorative,   // 장식
    Interaction,  // 상호작용 포인트
}

// 인덱스: (hex_x, hex_z, dimension_id)로 빠른 조회
#[spacetimedb::index(name = "position_idx")]
pub fn position_idx(footprint: &BuildingFootprint) -> (i32, i32, u32) {
    (footprint.hex_x, footprint.hex_z, footprint.dimension_id)
}
```

### 3.5 Claim State (영토) - 기존 확장

```rust
// claim_state.rs - 기존 테이블에 필드 추가
#[spacetimedb::table(name = claim_state, public)]
pub struct ClaimState {
    #[primary_key]
    pub claim_id: u64,
    pub owner_id: u64,
    pub region_id: u64,
    pub tier: u32,
    
    // 추가 필드
    pub totem_building_id: u64,  // 클레임 토템 건축물 ID
    pub supply_pool: u32,        // 현재 공급량
    pub max_supply: u32,         // 최대 공급 저장량
    pub supply_consumption_per_hour: u32,  // 시간당 소비량
    pub last_supply_update: Timestamp,
    
    // 클레임 타일 (최적화: R-Tree 또는 그리드 인덱스)
    pub claimed_tiles: Vec<ClaimedTile>,
    pub tile_count: u32,  // 총 타일 수 (최대치 계산용)
}

pub struct ClaimedTile {
    pub hex_x: i32,
    pub hex_z: i32,
    pub claimed_at: Timestamp,
}

// 클레임 멤버 권한
#[spacetimedb::table(name = claim_permission)]
pub struct ClaimPermission {
    #[primary_key]
    pub claim_id: u64,
    #[primary_key]
    pub player_id: u64,
    
    pub role: ClaimRole,  // Owner/Officer/Member
    pub can_build: bool,
    pub can_use_inventory: bool,
    pub can_harvest: bool,
    pub can_manage_permissions: bool,
}

pub enum ClaimRole {
    Owner,
    Officer,
    Member,
}
```

---

## 4. 배치 및 건설 알고리즘

### 4.1 건축물 배치 검증

```rust
// building_placement.rs
pub struct BuildingPlacementValidator;

impl BuildingPlacementValidator {
    /// 프로젝트 사이트 배치 전 검증
    pub fn validate_placement(
        ctx: &ReducerContext,
        building_def: &BuildingDef,
        origin: &HexCoordinates,
        facing: HexDirection,
        dimension_id: u32,
        player_id: u64,
    ) -> Result<PlacementValidation, BuildingError> {
        
        // 1. 플레이어 상태 검증
        let player = ctx.db.player_state().entity_id().find(player_id)
            .ok_or(BuildingError::PlayerNotFound)?;
        
        if player.is_mounted {
            return Err(BuildingError::CannotBuildWhileMounted);
        }
        
        // 2. 거리 검증
        let player_pos = HexCoordinates::from_world_position(player.position);
        let distance = player_pos.distance_to(origin);
        if distance > MAX_BUILD_DISTANCE {
            return Err(BuildingError::TooFar);
        }
        
        // 3. 차원 검증
        if !building_def.placement_constraints.allowed_dimensions.contains(&dimension_id) {
            return Err(BuildingError::InvalidDimension);
        }
        
        // 4. 지형 검증
        let terrain_validation = self.validate_terrain(
            ctx, building_def, origin, facing, dimension_id
        )?;
        
        // 5. Footprint 충돌 검사
        let footprint_tiles = building_def.get_rotated_footprint(facing);
        for tile in &footprint_tiles {
            let tile_pos = HexCoordinates {
                x: origin.x + tile.relative_x as i32,
                z: origin.z + tile.relative_z as i32,
            };
            
            // 기존 건축물/자원 충돌 검사
            if self.is_tile_occupied(ctx, &tile_pos, dimension_id) {
                return Err(BuildingError::TileOccupied { 
                    x: tile_pos.x, 
                    z: tile_pos.z 
                });
            }
            
            // 지형 유효성 검사
            if !self.is_valid_terrain(&terrain_validation, tile) {
                return Err(BuildingError::InvalidTerrain);
            }
        }
        
        // 6. Perimeter 충돌 검사 (배치 금지 영역)
        for dir in &building_def.perimeter {
            let rotated_dir = rotate_direction(*dir, facing);
            let perimeter_pos = origin.neighbor(rotated_dir);
            
            // Perimeter는 다른 건축물과 겹칠 수 없음
            if self.has_building_at(ctx, &perimeter_pos, dimension_id) {
                return Err(BuildingError::PerimeterOverlap);
            }
        }
        
        // 7. 클레임 검증
        let claim_validation = self.validate_claim(
            ctx, player_id, origin, &footprint_tiles, dimension_id
        )?;
        
        // 8. 바이옴 제약 검증
        let biome_id = get_biome_at(ctx, origin);
        if building_def.placement_constraints.forbidden_biomes.contains(&biome_id) {
            return Err(BuildingError::ForbiddenBiome);
        }
        
        // 9. 최소 거리 검증 (클레임 간)
        if let Some(min_dist) = building_def.placement_constraints.min_distance_to_claim {
            if !self.check_min_claim_distance(ctx, origin, min_dist) {
                return Err(BuildingError::TooCloseToClaim);
            }
        }
        
        Ok(PlacementValidation {
            can_place: true,
            claim_id: claim_validation.claim_id,
            required_materials: building_def.construction.required_materials.clone(),
        })
    }
    
    fn validate_terrain(
        &self,
        ctx: &ReducerContext,
        building_def: &BuildingDef,
        origin: &HexCoordinates,
        facing: HexDirection,
        dimension_id: u32,
    ) -> Result<TerrainValidation, BuildingError> {
        let constraints = &building_def.placement_constraints;
        let footprint = building_def.get_rotated_footprint(facing);
        
        // 코너 셀 검증 (HexGrid에서 3타일 교차점)
        if constraints.corner_cell_only && !origin.is_corner_cell() {
            return Err(BuildingError::MustPlaceOnCorner);
        }
        
        // 지형 높이 수집
        let mut elevations: Vec<i16> = Vec::new();
        for tile in &footprint {
            let tile_pos = HexCoordinates {
                x: origin.x + tile.relative_x as i32,
                z: origin.z + tile.relative_z as i32,
            };
            
            let terrain = get_terrain_at(ctx, &tile_pos, dimension_id)?;
            elevations.push(terrain.elevation);
        }
        
        // 평탄도 검증
        let min_elev = elevations.iter().min().copied().unwrap_or(0);
        let max_elev = elevations.iter().max().copied().unwrap_or(0);
        let slope = max_elev - min_elev;
        
        if constraints.requires_flat_surface && slope > 0 {
            return Err(BuildingError::SurfaceNotFlat);
        }
        
        if slope > constraints.max_slope {
            return Err(BuildingError::SlopeTooSteep { 
                current: slope, 
                max: constraints.max_slope 
            });
        }
        
        // 포장 검증
        if constraints.requires_paving {
            for tile in &footprint {
                let tile_pos = HexCoordinates {
                    x: origin.x + tile.relative_x as i32,
                    z: origin.z + tile.relative_z as i32,
                };
                let terrain = get_terrain_at(ctx, &tile_pos, dimension_id)?;
                if !terrain.is_paved {
                    return Err(BuildingError::RequiresPaving);
                }
            }
        }
        
        Ok(TerrainValidation {
            base_elevation: min_elev,
            max_slope: slope,
            is_valid: true,
        })
    }
    
    fn validate_claim(
        &self,
        ctx: &ReducerContext,
        player_id: u64,
        origin: &HexCoordinates,
        footprint: &[FootprintTile],
        dimension_id: u32,
    ) -> Result<ClaimValidation, BuildingError> {
        
        // 클레임 토템은 특별한 검증 규칙 적용
        let is_claim_totem = building_def.category == BuildingCategory::Claim;
        
        if is_claim_totem {
            return self.validate_claim_totem_placement(ctx, player_id, origin, dimension_id);
        }
        
        // 일반 건축물: 클레임 내 배치 검증
        let mut covering_claims: Vec<u64> = Vec::new();
        
        for tile in footprint {
            let tile_pos = HexCoordinates {
                x: origin.x + tile.relative_x as i32,
                z: origin.z + tile.relative_z as i32,
            };
            
            if let Some(claim_id) = get_claim_at(ctx, &tile_pos, dimension_id) {
                covering_claims.push(claim_id);
            }
        }
        
        // 모든 타일이 동일한 클레임 내에 있어야 함
        let primary_claim = covering_claims.first().copied();
        
        if let Some(claim_id) = primary_claim {
            // 권한 검증
            if !has_claim_permission(ctx, player_id, claim_id, PermissionFlag::BUILD) {
                return Err(BuildingError::NoBuildPermission);
            }
            
            // 모든 타일이 동일한 클레임인지 확인
            if covering_claims.iter().any(|&id| id != claim_id) {
                return Err(BuildingError::CrossesClaimBoundary);
            }
            
            Ok(ClaimValidation {
                claim_id: Some(claim_id),
                is_within_claim: true,
            })
        } else {
            // 클레임 외 배치 (와일드니스)
            // 와일드니스 건축 제한 검사
            if !ALLOW_WILDERNESS_BUILDING {
                return Err(BuildingError::MustBuildInClaim);
            }
            
            Ok(ClaimValidation {
                claim_id: None,
                is_within_claim: false,
            })
        }
    }
}
```

### 4.2 Footprint 생성 및 회전

```rust
// footprint_helpers.rs
pub fn create_footprint_tiles(
    building_def: &BuildingDef,
    origin: &HexCoordinates,
    facing: HexDirection,
    building_entity_id: u64,
    dimension_id: u32,
) -> Vec<BuildingFootprint> {
    let mut tiles = Vec::new();
    
    // Hitbox/Walkable/Decorative 타일 생성
    for tile_def in &building_def.footprint {
        // 방향에 따른 회전 적용
        let rotated_pos = rotate_tile_position(&tile_def, facing);
        
        let tile = BuildingFootprint {
            tile_id: generate_unique_id(),
            hex_x: origin.x + rotated_pos.0 as i32,
            hex_z: origin.z + rotated_pos.1 as i32,
            dimension_id,
            building_entity_id,
            tile_type: tile_def.tile_type,
            is_perimeter: false,
            interaction_id: None,
        };
        
        tiles.push(tile);
    }
    
    // Perimeter 차단 영역 표시
    for dir in &building_def.perimeter {
        let rotated_dir = rotate_direction(*dir, facing);
        let perimeter_pos = origin.neighbor(rotated_dir);
        
        tiles.push(BuildingFootprint {
            tile_id: generate_unique_id(),
            hex_x: perimeter_pos.x,
            hex_z: perimeter_pos.z,
            dimension_id,
            building_entity_id,
            tile_type: TileType::Decorative,  // 시각적 표시만
            is_perimeter: true,
            interaction_id: None,
        });
    }
    
    tiles
}

/// Hex 방향에 따른 상대 좌표 회전
fn rotate_tile_position(tile: &FootprintTile, facing: HexDirection) -> (i8, i8) {
    let (x, z) = (tile.relative_x, tile.relative_z);
    
    // Hex 방향별 회전 행렬 적용
    match facing {
        HexDirection::East => (x, z),
        HexDirection::SouthEast => (x + z, -x),
        HexDirection::SouthWest => (z, -x - z),
        HexDirection::West => (-x, -z),
        HexDirection::NorthWest => (-x - z, x),
        HexDirection::NorthEast => (-z, x + z),
    }
}
```

### 4.3 건설 진행 알고리즘

```rust
// construction_progress.rs
pub fn advance_construction(
    ctx: &ReducerContext,
    project_site_id: u64,
    player_id: u64,
) -> Result<ConstructionResult, BuildingError> {
    
    let mut project = ctx.db.project_site_state()
        .entity_id()
        .find(project_site_id)
        .ok_or(BuildingError::ProjectNotFound)?;
    
    let building_def = get_building_def(project.building_def_id)?;
    
    // 1. 권한 검증
    if !can_build_at_site(ctx, player_id, &project) {
        return Err(BuildingError::NoBuildPermission);
    }
    
    // 2. 스태미나 검증
    let mut player_state = ctx.db.resource_state().entity_id().find(player_id)
        .ok_or(BuildingError::PlayerNotFound)?;
    
    if player_state.stamina < building_def.construction.action_stamina_cost {
        return Err(BuildingError::NotEnoughStamina);
    }
    
    // 3. 도구 검증
    if let Some(required_tool) = building_def.construction.required_tool {
        if !has_equipped_tool(ctx, player_id, required_tool) {
            return Err(BuildingError::RequiredToolMissing);
        }
    }
    
    // 4. 자재 검증 (남은 자재 계산)
    let remaining_materials = calculate_remaining_materials(&project, &building_def.construction);
    if !remaining_materials.is_empty() {
        return Err(BuildingError::MaterialsRequired { 
            materials: remaining_materials 
        });
    }
    
    // 5. 스태미나 소모
    player_state.stamina -= building_def.construction.action_stamina_cost;
    ctx.db.resource_state().entity_id().update(player_state);
    
    // 6. 진행률 계산 (스킬/도구 보너스 적용)
    let progress = calculate_progress(
        ctx, 
        player_id, 
        &building_def.construction
    );
    
    // 7. 진행 업데이트
    project.current_actions += 1;
    project.last_progress_at = ctx.timestamp;
    
    // 기여자 정보 업데이트
    update_contributor_info(&mut project, player_id, progress);
    
    ctx.db.project_site_state().entity_id().update(project.clone());
    
    // 8. 완공 체크
    if project.current_actions >= project.total_actions {
        return complete_construction(ctx, &project, &building_def);
    }
    
    Ok(ConstructionResult::InProgress {
        current: project.current_actions,
        total: project.total_actions,
        percentage: (project.current_actions as f32 / project.total_actions as f32) * 100.0,
    })
}

fn calculate_progress(
    ctx: &ReducerContext,
    player_id: u64,
    recipe: &ConstructionRecipe,
) -> f32 {
    let mut progress = recipe.base_progress_per_action;
    
    // 도구 보너스
    if let Some(tool_power) = get_equipped_tool_power(ctx, player_id) {
        progress *= 1.0 + (tool_power as f32 * 0.1);
    }
    
    // 스킬 보너스
    let skill_level = get_skill_level(ctx, player_id, SkillType::Construction);
    progress *= 1.0 + (skill_level as f32 * recipe.skill_bonus.per_level);
    
    // 치명타 확률 (스킬 기반)
    let crit_chance = 0.05 + (skill_level as f32 * 0.01);
    if random::<f32>() < crit_chance {
        progress *= 2.0;  // 치명타: 2배 진행
    }
    
    progress
}

fn complete_construction(
    ctx: &ReducerContext,
    project: &ProjectSiteState,
    building_def: &BuildingDef,
) -> Result<ConstructionResult, BuildingError> {
    
    // 1. 프로젝트 사이트 제거
    ctx.db.project_site_state().entity_id().delete(project.entity_id);
    
    // 2. 건축물 생성
    let building_id = generate_unique_id();
    
    let building = BuildingState {
        entity_id: building_id,
        building_def_id: project.building_def_id,
        owner_id: project.owner_id,
        claim_id: project.claim_id,
        constructed_by: Some(project.contributors.first().map(|c| c.player_id).unwrap_or(project.owner_id)),
        hex_x: project.hex_x,
        hex_z: project.hex_z,
        facing: project.facing,
        dimension_id: project.dimension_id,
        current_durability: building_def.max_durability,
        max_durability: building_def.max_durability,
        state: BuildingStateEnum::Normal,
        last_maintenance_at: ctx.timestamp,
        is_active: true,
        nickname: None,
        interior_instance_id: None,
    };
    
    ctx.db.building_state().entity_id().insert(building);
    
    // 3. Footprint 업데이트 (Project Site → Building)
    update_footprint_for_completion(ctx, project.entity_id, building_id);
    
    // 4. 기능 초기화
    initialize_building_functions(ctx, &building, building_def);
    
    // 5. 인테리어 생성 (Housing/Storage 등)
    if building_def.enterable {
        let interior_id = create_interior_instance(ctx, building_id, building_def)?;
        
        let mut building = ctx.db.building_state().entity_id().find(building_id).unwrap();
        building.interior_instance_id = Some(interior_id);
        ctx.db.building_state().entity_id().update(building);
    }
    
    // 6. 경험치/스킬 보상
    award_construction_xp(ctx, &project.contributors, building_def);
    
    // 7. 권한 설정
    setup_building_permissions(ctx, building_id, &project);
    
    Ok(ConstructionResult::Completed { building_id })
}
```

---

## 5. 리듀서 API

### 5.1 프로젝트 사이트 생성 (배치)

```rust
#[spacetimedb::reducer]
pub fn building_place(
    ctx: &ReducerContext,
    building_def_id: u32,
    hex_x: i32,
    hex_z: i32,
    facing: u8,  // HexDirection
) -> Result<u64, BuildingError> {
    let player_id = ctx.sender;
    let origin = HexCoordinates { x: hex_x, z: hex_z };
    let direction = HexDirection::from_u8(facing)?;
    
    let building_def = get_building_def(building_def_id)
        .ok_or(BuildingError::InvalidBuildingDef)?;
    
    // 배치 검증
    let validator = BuildingPlacementValidator::new();
    let validation = validator.validate_placement(
        ctx, &building_def, &origin, direction, 0, player_id
    )?;
    
    // 즉시 완성 건축물 (작은 장식물 등)
    if building_def.construction.instant_build {
        return create_instant_building(ctx, &building_def, &origin, direction, player_id);
    }
    
    // 프로젝트 사이트 생성
    let project_id = generate_unique_id();
    let project = ProjectSiteState {
        entity_id: project_id,
        building_def_id,
        owner_id: player_id,
        claim_id: validation.claim_id,
        hex_x,
        hex_z,
        facing,
        dimension_id: 0,
        current_actions: 0,
        total_actions: building_def.construction.required_actions,
        materials_contributed: Vec::new(),
        contributors: vec![ContributorInfo {
            player_id,
            actions_performed: 0,
            materials_contributed: Vec::new(),
        }],
        created_at: ctx.timestamp,
        last_progress_at: ctx.timestamp,
        is_abandoned: false,
    };
    
    ctx.db.project_site_state().entity_id().insert(project);
    
    // 임시 Footprint 생성
    let footprint_tiles = create_footprint_tiles(
        &building_def, &origin, direction, project_id, 0
    );
    
    for tile in footprint_tiles {
        ctx.db.building_footprint().tile_id().insert(tile);
    }
    
    // 클라이언트에 필요한 자재 목록 반환
    Ok(project_id)
}
```

### 5.2 자재 투입

```rust
#[spacetimedb::reducer]
pub fn building_add_materials(
    ctx: &ReducerContext,
    project_site_id: u64,
    materials: Vec<ItemStack>,  // 아이템과 수량
    from_inventory_slot: Vec<u32>,  // 인벤토리 슬롯
) -> Result<MaterialContributionResult, BuildingError> {
    let player_id = ctx.sender;
    
    let mut project = ctx.db.project_site_state()
        .entity_id()
        .find(project_site_id)
        .ok_or(BuildingError::ProjectNotFound)?;
    
    let building_def = get_building_def(project.building_def_id)?;
    
    // 권한 검증
    if !can_build_at_site(ctx, player_id, &project) {
        return Err(BuildingError::NoBuildPermission);
    }
    
    // 필요 자재 계산
    let remaining = calculate_remaining_materials(&project, &building_def.construction);
    
    // 자재 검증 및 인벤토리에서 제거
    let mut contributed = Vec::new();
    for (item_stack, slot) in materials.iter().zip(from_inventory_slot.iter()) {
        // 인벤토리에서 아이템 확인
        let inventory_item = get_inventory_item(ctx, player_id, *slot)?;
        if inventory_item.item_def_id != item_stack.item_def_id {
            return Err(BuildingError::ItemMismatch);
        }
        if inventory_item.quantity < item_stack.quantity {
            return Err(BuildingError::NotEnoughItems);
        }
        
        // 필요량 검증 (과잉 투입 방지)
        let needed = remaining.iter()
            .find(|r| r.item_def_id == item_stack.item_def_id)
            .map(|r| r.quantity)
            .unwrap_or(0);
        
        if item_stack.quantity > needed {
            return Err(BuildingError::ExcessMaterials { 
                item_id: item_stack.item_def_id,
                provided: item_stack.quantity,
                needed 
            });
        }
        
        // 인벤토리에서 제거
        remove_from_inventory(ctx, player_id, *slot, item_stack.quantity)?;
        
        // 프로젝트에 기록
        project.materials_contributed.push(ContributedMaterial {
            item_def_id: item_stack.item_def_id,
            quantity: item_stack.quantity,
            contributed_by: player_id,
        });
        
        contributed.push(item_stack.clone());
    }
    
    // 기여자 정보 업데이트
    update_material_contributor(&mut project, player_id, &contributed);
    
    ctx.db.project_site_state().entity_id().update(project);
    
    Ok(MaterialContributionResult {
        contributed,
        remaining: calculate_remaining_materials(&project, &building_def.construction),
    })
}
```

### 5.3 건설 진행

```rust
#[spacetimedb::reducer]
pub fn building_advance(
    ctx: &ReducerContext,
    project_site_id: u64,
) -> Result<ConstructionResult, BuildingError> {
    advance_construction(ctx, project_site_id, ctx.sender)
}
```

### 5.4 건축물 이동

```rust
#[spacetimedb::reducer]
pub fn building_move(
    ctx: &ReducerContext,
    building_id: u64,
    new_hex_x: i32,
    new_hex_z: i32,
    new_facing: u8,
) -> Result<(), BuildingError> {
    let player_id = ctx.sender;
    
    let building = ctx.db.building_state()
        .entity_id()
        .find(building_id)
        .ok_or(BuildingError::BuildingNotFound)?;
    
    let building_def = get_building_def(building.building_def_id)?;
    
    // 이동 가능 여부 검증
    if !building_def.can_move {
        return Err(BuildingError::CannotMoveThisBuilding);
    }
    
    // 권한 검증
    if !is_building_owner(ctx, player_id, building_id) {
        return Err(BuildingError::NotOwner);
    }
    
    // 이동 비용 검증
    for cost in &building_def.move_cost {
        if !has_items_in_inventory(ctx, player_id, cost) {
            return Err(BuildingError::MoveCostNotMet);
        }
    }
    
    // 새 위치 검증
    let new_origin = HexCoordinates { x: new_hex_x, z: new_hex_z };
    let new_direction = HexDirection::from_u8(new_facing)?;
    
    let validator = BuildingPlacementValidator::new();
    let validation = validator.validate_placement(
        ctx, &building_def, &new_origin, new_direction, 
        building.dimension_id, player_id
    )?;
    
    // 비용 소모
    for cost in &building_def.move_cost {
        consume_items_from_inventory(ctx, player_id, cost)?;
    }
    
    // 기존 Footprint 제거
    delete_building_footprint(ctx, building_id);
    
    // 위치 업데이트
    let mut building = ctx.db.building_state().entity_id().find(building_id).unwrap();
    building.hex_x = new_hex_x;
    building.hex_z = new_hex_z;
    building.facing = new_facing;
    ctx.db.building_state().entity_id().update(building);
    
    // 새 Footprint 생성
    let footprint_tiles = create_footprint_tiles(
        &building_def, &new_origin, new_direction, building_id, building.dimension_id
    );
    
    for tile in footprint_tiles {
        ctx.db.building_footprint().tile_id().insert(tile);
    }
    
    Ok(())
}
```

### 5.5 건축물 철거

```rust
#[spacetimedb::reducer]
pub fn building_deconstruct(
    ctx: &ReducerContext,
    building_id: u64,
) -> Result<DeconstructionResult, BuildingError> {
    let player_id = ctx.sender;
    
    let building = ctx.db.building_state()
        .entity_id()
        .find(building_id)
        .ok_or(BuildingError::BuildingNotFound)?;
    
    let building_def = get_building_def(building.building_def_id)?;
    
    // 권한 검증
    if !has_building_permission(ctx, player_id, building_id, PermissionFlag::BUILD) {
        return Err(BuildingError::NoDeconstructPermission);
    }
    
    // 특수 케이스 검증 (인테리어 내 플레이어, 진행 중인 제작 등)
    if building.enterable {
        if has_players_inside(ctx, building.interior_instance_id) {
            return Err(BuildingError::PlayersInside);
        }
    }
    
    // 도구 검증
    if let Some(required_tool) = building_def.deconstruction.requires_tool {
        if !has_equipped_tool(ctx, player_id, required_tool) {
            return Err(BuildingError::RequiredToolMissing);
        }
    }
    
    // 내부 인벤토리 반환
    if building_def.deconstruction.refund_inventory {
        refund_building_inventory(ctx, building_id, player_id)?;
    }
    
    // 재료 반환
    let mut refunded_materials = Vec::new();
    for material in &building_def.deconstruction.refund_materials {
        let durability_ratio = building.current_durability as f32 / building.max_durability as f32;
        let refund_quantity = (material.quantity as f32 * durability_ratio) as u32;
        
        if refund_quantity > 0 {
            add_to_inventory(ctx, player_id, material.item_def_id, refund_quantity)?;
            refunded_materials.push(ItemStack {
                item_def_id: material.item_def_id,
                quantity: refund_quantity,
            });
        }
    }
    
    // Footprint 제거
    delete_building_footprint(ctx, building_id);
    
    // 인테리어 제거
    if let Some(interior_id) = building.interior_instance_id {
        delete_interior_instance(ctx, interior_id)?;
    }
    
    // 클레임 토템 특수 처리
    if let BuildingCategory::Claim { .. } = building_def.category {
        dissolve_claim(ctx, building.claim_id.unwrap_or(0))?;
    }
    
    // 건축물 제거
    ctx.db.building_state().entity_id().delete(building_id);
    
    Ok(DeconstructionResult {
        refunded_materials,
        durability_ratio: building.current_durability as f32 / building.max_durability as f32,
    })
}
```

### 5.6 프로젝트 취소

```rust
#[spacetimedb::reducer]
pub fn building_cancel_project(
    ctx: &ReducerContext,
    project_site_id: u64,
) -> Result<(), BuildingError> {
    let player_id = ctx.sender;
    
    let project = ctx.db.project_site_state()
        .entity_id()
        .find(project_site_id)
        .ok_or(BuildingError::ProjectNotFound)?;
    
    // 권한 검증 (소유자 또는 클레임 관리자)
    if project.owner_id != player_id {
        if let Some(claim_id) = project.claim_id {
            if !has_claim_permission(ctx, player_id, claim_id, PermissionFlag::ADMIN) {
                return Err(BuildingError::NotAuthorized);
            }
        } else {
            return Err(BuildingError::NotAuthorized);
        }
    }
    
    // 투입된 자재 반환
    for material in &project.materials_contributed {
        add_to_inventory(ctx, material.contributed_by, material.item_def_id, material.quantity)?;
    }
    
    // Footprint 제거
    delete_building_footprint(ctx, project_site_id);
    
    // 프로젝트 제거
    ctx.db.project_site_state().entity_id().delete(project_site_id);
    
    Ok(())
}
```

---

## 6. 유지/감가 시스템

### 6.1 건축물 감가 에이전트

```rust
// building_decay_agent.rs
#[spacetimedb::table(name = building_decay_schedule)]
pub struct BuildingDecaySchedule {
    #[primary_key]
    pub id: u64,
    pub next_tick_at: Timestamp,
    pub tick_interval_seconds: u32,
}

#[spacetimedb::reducer]
pub fn building_decay_tick(ctx: &ReducerContext) {
    let schedule = ctx.db.building_decay_schedule().id().find(0);
    let now = ctx.timestamp;
    
    if let Some(s) = schedule {
        if now < s.next_tick_at {
            return;
        }
        
        // 다음 틱 예약
        let mut next_schedule = s.clone();
        next_schedule.next_tick_at = now + s.tick_interval_seconds as u64;
        ctx.db.building_decay_schedule().id().update(next_schedule);
    }
    
    // 모든 건축물 순회 (최적화: 배치 처리)
    let buildings = ctx.db.building_state().iter();
    
    for building in buildings {
        process_building_decay(ctx, &building, now);
    }
}

fn process_building_decay(
    ctx: &ReducerContext,
    building: &BuildingState,
    now: Timestamp,
) {
    let building_def = match get_building_def(building.building_def_id) {
        Some(def) => def,
        None => return,
    };
    
    // 클레임 내 건축물: 공급량 확인
    if let Some(claim_id) = building.claim_id {
        if let Some(claim) = ctx.db.claim_state().claim_id().find(claim_id) {
            let hours_since_maintenance = 
                (now - building.last_maintenance_at) / 3600;
            
            if hours_since_maintenance > 0 {
                let required_supply = building_def.maintenance_cost.supply_consumption_per_hour 
                    * hours_since_maintenance as u32;
                
                if claim.supply_pool >= required_supply {
                    // 공급 충분: 내구도 회복 (천천히)
                    let mut updated_building = building.clone();
                    let repair_amount = hours_since_maintenance as u32 * 5;  // 시간당 5 내구도
                    updated_building.current_durability = 
                        (updated_building.current_durability + repair_amount)
                        .min(updated_building.max_durability);
                    updated_building.last_maintenance_at = now;
                    updated_building.state = BuildingStateEnum::Normal;
                    
                    ctx.db.building_state().entity_id().update(updated_building);
                    
                    // 공급 소모
                    let mut updated_claim = claim.clone();
                    updated_claim.supply_pool -= required_supply;
                    ctx.db.claim_state().claim_id().update(updated_claim);
                } else {
                    // 공급 부족: 내구도 감소
                    let decay_amount = building_def.maintenance_cost.durability_decay_per_hour 
                        * hours_since_maintenance as u32;
                    
                    let mut updated_building = building.clone();
                    if updated_building.current_durability > decay_amount {
                        updated_building.current_durability -= decay_amount;
                        updated_building.state = BuildingStateEnum::Decaying;
                    } else {
                        // 내구도 0: 파괴
                        destroy_building(ctx, building.entity_id);
                        return;
                    }
                    
                    ctx.db.building_state().entity_id().update(updated_building);
                }
            }
        }
    } else {
        // 와일드니스 건축물: 빠른 감가
        let hours_since_maintenance = (now - building.last_maintenance_at) / 3600;
        if hours_since_maintenance > 0 {
            let wildness_decay = hours_since_maintenance as u32 * 50;  // 빠른 감가
            
            let mut updated_building = building.clone();
            if updated_building.current_durability > wildness_decay {
                updated_building.current_durability -= wildness_decay;
                updated_building.state = BuildingStateEnum::Decaying;
                ctx.db.building_state().entity_id().update(updated_building);
            } else {
                destroy_building(ctx, building.entity_id);
            }
        }
    }
}
```

### 6.2 수리 기능

```rust
#[spacetimedb::reducer]
pub fn building_repair(
    ctx: &ReducerContext,
    building_id: u64,
) -> Result<RepairResult, BuildingError> {
    let player_id = ctx.sender;
    
    let mut building = ctx.db.building_state()
        .entity_id()
        .find(building_id)
        .ok_or(BuildingError::BuildingNotFound)?;
    
    let building_def = get_building_def(building.building_def_id)?;
    
    // 권한 검증
    if !has_building_permission(ctx, player_id, building_id, PermissionFlag::BUILD) {
        return Err(BuildingError::NoRepairPermission);
    }
    
    // 내구도 확인
    if building.current_durability >= building.max_durability {
        return Err(BuildingError::AlreadyFullyRepaired);
    }
    
    // 수리 비용 계산
    let missing_durability = building.max_durability - building.current_durability;
    let repair_cost = calculate_repair_cost(&building_def, missing_durability);
    
    // 자재 확인
    for cost in &repair_cost {
        if !has_items_in_inventory(ctx, player_id, cost) {
            return Err(BuildingError::RepairMaterialsRequired { 
                materials: repair_cost.clone() 
            });
        }
    }
    
    // 자재 소모
    for cost in &repair_cost {
        consume_items_from_inventory(ctx, player_id, cost)?;
    }
    
    // 스태미나 소모
    let mut player_state = ctx.db.resource_state().entity_id().find(player_id)
        .ok_or(BuildingError::PlayerNotFound)?;
    player_state.stamina = player_state.stamina.saturating_sub(20);
    ctx.db.resource_state().entity_id().update(player_state);
    
    // 수리 적용
    let repair_amount = (building.max_durability as f32 * 0.3) as u32;  // 30% 회복
    building.current_durability = (building.current_durability + repair_amount)
        .min(building.max_durability);
    building.state = BuildingStateEnum::Normal;
    
    ctx.db.building_state().entity_id().update(building);
    
    Ok(RepairResult {
        repaired_amount: repair_amount,
        new_durability: building.current_durability,
        max_durability: building.max_durability,
    })
}
```

---

## 7. 클레임 (영토) 시스템

### 7.1 클레임 토템 배치

```rust
#[spacetimedb::reducer]
pub fn claim_totem_place(
    ctx: &ReducerContext,
    building_def_id: u32,
    hex_x: i32,
    hex_z: i32,
) -> Result<u64, BuildingError> {
    let player_id = ctx.sender;
    let origin = HexCoordinates { x: hex_x, z: hex_z };
    
    let building_def = get_building_def(building_def_id)
        .ok_or(BuildingError::InvalidBuildingDef)?;
    
    // 클레임 토템 검증
    let BuildingCategory::Claim { base_radius } = building_def.category else {
        return Err(BuildingError::NotAClaimTotem);
    };
    
    // 기존 클레임 거리 검사
    if !check_min_claim_distance(ctx, &origin, MIN_CLAIM_DISTANCE) {
        return Err(BuildingError::TooCloseToExistingClaim);
    }
    
    // 클레임 생성
    let claim_id = generate_unique_id();
    let totem_id = generate_unique_id();
    
    let claim = ClaimState {
        claim_id,
        owner_id: player_id,
        region_id: get_region_at(&origin),
        tier: 1,
        totem_building_id: totem_id,
        supply_pool: 0,
        max_supply: base_radius as u32 * 100,
        supply_consumption_per_hour: base_radius as u32 * 5,
        last_supply_update: ctx.timestamp,
        claimed_tiles: generate_claimed_tiles(&origin, base_radius),
        tile_count: calculate_tile_count(base_radius),
    };
    
    ctx.db.claim_state().claim_id().insert(claim);
    
    // 소유자 권한 설정
    ctx.db.claim_permission().insert(ClaimPermission {
        claim_id,
        player_id,
        role: ClaimRole::Owner,
        can_build: true,
        can_use_inventory: true,
        can_harvest: true,
        can_manage_permissions: true,
    });
    
    // 토템 건축물 즉시 생성 (프로젝트 사이트 없이)
    let totem = BuildingState {
        entity_id: totem_id,
        building_def_id,
        owner_id: player_id,
        claim_id: Some(claim_id),
        constructed_by: Some(player_id),
        hex_x,
        hex_z,
        facing: 0,
        dimension_id: 0,
        current_durability: building_def.max_durability,
        max_durability: building_def.max_durability,
        state: BuildingStateEnum::Normal,
        last_maintenance_at: ctx.timestamp,
        is_active: true,
        nickname: None,
        interior_instance_id: None,
    };
    
    ctx.db.building_state().entity_id().insert(totem);
    
    // Footprint 생성
    let footprint_tiles = create_footprint_tiles(
        &building_def, &origin, HexDirection::East, totem_id, 0
    );
    
    for tile in footprint_tiles {
        ctx.db.building_footprint().tile_id().insert(tile);
    }
    
    Ok(claim_id)
}
```

### 7.2 클레임 확장

```rust
#[spacetimedb::reducer]
pub fn claim_expand(
    ctx: &ReducerContext,
    claim_id: u64,
    direction: HexDirection,
) -> Result<ClaimExpansionResult, BuildingError> {
    let player_id = ctx.sender;
    
    let mut claim = ctx.db.claim_state()
        .claim_id()
        .find(claim_id)
        .ok_or(BuildingError::ClaimNotFound)?;
    
    // 권한 검증
    let permission = ctx.db.claim_permission()
        .find((claim_id, player_id))
        .ok_or(BuildingError::NoClaimPermission)?;
    
    if !permission.can_manage_permissions && permission.role != ClaimRole::Owner {
        return Err(BuildingError::CannotExpandClaim);
    }
    
    // 최대 타일 수 검증
    let max_tiles = calculate_max_tiles_for_tier(claim.tier);
    if claim.tile_count >= max_tiles {
        return Err(BuildingError::ClaimAtMaxSize);
    }
    
    // 확장할 새 타일들 계산
    let new_tiles = calculate_expansion_tiles(&claim, direction);
    
    // 인접 검증 (분리/고립 방지)
    if !validate_tile_connectivity(&claim.claimed_tiles, &new_tiles) {
        return Err(BuildingError::ExpansionWouldIsolate);
    }
    
    // 다른 클레임과 충돌 검사
    for tile in &new_tiles {
        if let Some(existing_claim) = get_claim_at(ctx, tile, 0) {
            if existing_claim != claim_id {
                return Err(BuildingError::ExpansionConflictsWithClaim);
            }
        }
    }
    
    // 확장 비용
    let expansion_cost = calculate_expansion_cost(claim.tier, new_tiles.len() as u32);
    for cost in &expansion_cost {
        if !has_items_in_inventory(ctx, player_id, cost) {
            return Err(BuildingError::ExpansionCostNotMet);
        }
    }
    
    // 비용 소모
    for cost in &expansion_cost {
        consume_items_from_inventory(ctx, player_id, cost)?;
    }
    
    // 타일 추가
    claim.claimed_tiles.extend(new_tiles.clone());
    claim.tile_count += new_tiles.len() as u32;
    claim.max_supply = claim.tile_count * 100;  // 타일당 100 공급량
    
    ctx.db.claim_state().claim_id().update(claim);
    
    Ok(ClaimExpansionResult {
        new_tiles,
        total_tiles: claim.tile_count,
        max_tiles,
    })
}
```

---

## 8. 권한 시스템 통합

### 8.1 건축물 권한 검사

```rust
// building_permission.rs
pub fn has_building_permission(
    ctx: &ReducerContext,
    player_id: u64,
    building_id: u64,
    required_flag: PermissionFlag,
) -> bool {
    // 1. 건축물 조회
    let building = match ctx.db.building_state().entity_id().find(building_id) {
        Some(b) => b,
        None => return false,
    };
    
    // 2. 소유자 확인
    if building.owner_id == player_id {
        return true;
    }
    
    // 3. permission_state 테이블 확인
    let perm = ctx.db.permission_state()
        .find((building_id, 1, player_id));  // subject_type=1 (Player)
    
    if let Some(p) = perm {
        if (p.flags & required_flag as u64) != 0 {
            return true;
        }
    }
    
    // 4. 파티 권한 확인
    if let Some(party_id) = get_player_party(ctx, player_id) {
        let party_perm = ctx.db.permission_state()
            .find((building_id, 2, party_id));  // subject_type=2 (Party)
        
        if let Some(p) = party_perm {
            if (p.flags & required_flag as u64) != 0 {
                return true;
            }
        }
    }
    
    // 5. 길드 권한 확인
    if let Some(guild_id) = get_player_guild(ctx, player_id) {
        let guild_perm = ctx.db.permission_state()
            .find((building_id, 3, guild_id));  // subject_type=3 (Guild)
        
        if let Some(p) = guild_perm {
            if (p.flags & required_flag as u64) != 0 {
                return true;
            }
        }
    }
    
    // 6. 클레임 권한 확인 (건축물이 클레임 내)
    if let Some(claim_id) = building.claim_id {
        if has_claim_permission(ctx, player_id, claim_id, required_flag) {
            return true;
        }
    }
    
    // 7. 건축물 정의의 기본 상호작용 레벨 확인
    let building_def = get_building_def(building.building_def_id);
    if let Some(def) = building_def {
        match def.interaction_level {
            InteractionLevel::All => return true,
            InteractionLevel::Party => {
                if is_in_same_party(ctx, player_id, building.owner_id) {
                    return true;
                }
            }
            InteractionLevel::Guild => {
                if is_in_same_guild(ctx, player_id, building.owner_id) {
                    return true;
                }
            }
            InteractionLevel::Owner => {}
        }
    }
    
    false
}

pub fn can_build_at_site(
    ctx: &ReducerContext,
    player_id: u64,
    project: &ProjectSiteState,
) -> bool {
    // 소유자
    if project.owner_id == player_id {
        return true;
    }
    
    // 클레임 내 프로젝트
    if let Some(claim_id) = project.claim_id {
        return has_claim_permission(ctx, player_id, claim_id, PermissionFlag::BUILD);
    }
    
    // 와일드니스 프로젝트 (협업 허용)
    has_building_permission(ctx, player_id, project.entity_id, PermissionFlag::BUILD)
}
```

---

## 9. 클라이언트-서버 동기화

### 9.1 건축물 스트리밍

```rust
// building_subscription.rs
#[spacetimedb::reducer]
pub fn subscribe_buildings_in_chunk(
    ctx: &ReducerContext,
    chunk_x: i32,
    chunk_z: i32,
) {
    let chunk = ChunkCoordinates { x: chunk_x, z: chunk_z, dimension: 0 };
    let bounds = chunk.get_bounds();
    
    // 해당 청크 내 모든 footprint 조회
    let footprints: Vec<BuildingFootprint> = ctx.db.building_footprint()
        .iter()
        .filter(|f| {
            f.hex_x >= bounds.min_x && f.hex_x < bounds.max_x &&
            f.hex_z >= bounds.min_z && f.hex_z < bounds.max_z &&
            f.dimension_id == 0
        })
        .collect();
    
    // 연결된 건축물 및 프로젝트 사이트 조회
    let building_ids: HashSet<u64> = footprints.iter()
        .map(|f| f.building_entity_id)
        .collect();
    
    for building_id in building_ids {
        // 건축물 상태 조회
        if let Some(building) = ctx.db.building_state().entity_id().find(building_id) {
            // 권한에 따른 뷰 필터링
            let view = create_building_view(ctx, ctx.sender, &building);
            ctx.emit(view);
        }
        // 프로젝트 사이트 조회
        else if let Some(project) = ctx.db.project_site_state().entity_id().find(building_id) {
            let view = create_project_site_view(ctx, ctx.sender, &project);
            ctx.emit(view);
        }
    }
}
```

### 9.2 배치 미리보기

```rust
#[spacetimedb::reducer]
pub fn building_validate_preview(
    ctx: &ReducerContext,
    building_def_id: u32,
    hex_x: i32,
    hex_z: i32,
    facing: u8,
) -> Result<PlacementPreview, BuildingError> {
    let player_id = ctx.sender;
    let origin = HexCoordinates { x: hex_x, z: hex_z };
    let direction = HexDirection::from_u8(facing)?;
    
    let building_def = get_building_def(building_def_id)
        .ok_or(BuildingError::InvalidBuildingDef)?;
    
    let validator = BuildingPlacementValidator::new();
    
    match validator.validate_placement(
        ctx, &building_def, &origin, direction, 0, player_id
    ) {
        Ok(validation) => Ok(PlacementPreview {
            is_valid: true,
            footprint_tiles: calculate_preview_tiles(&building_def, &origin, direction),
            required_materials: validation.required_materials,
            claim_id: validation.claim_id,
        }),
        Err(e) => Ok(PlacementPreview {
            is_valid: false,
            error: Some(e.to_string()),
            footprint_tiles: calculate_preview_tiles(&building_def, &origin, direction),
            required_materials: building_def.construction.required_materials.clone(),
            claim_id: None,
        }),
    }
}
```

---

## 10. 테이블 스키마 요약

### 10.1 핵심 테이블

| 테이블 | 목적 | 접근 |
|--------|------|------|
| `building_state` | 완성된 건축물 | public |
| `project_site_state` | 건설 중인 프로젝트 | public |
| `building_footprint` | 건축물 타일 맵 | public |
| `claim_state` | 영토 클레임 | public |
| `claim_permission` | 클레임 멤버 권한 | private |

### 10.2 인덱스

```rust
// building_state
#[spacetimedb::index(name = "owner_idx")]
pub fn owner_idx(building: &BuildingState) -> u64 {
    building.owner_id
}

#[spacetimedb::index(name = "claim_idx")]
pub fn claim_idx(building: &BuildingState) -> Option<u64> {
    building.claim_id
}

#[spacetimedb::index(name = "position_idx")]
pub fn position_idx(building: &BuildingState) -> (i32, i32, u32) {
    (building.hex_x, building.hex_z, building.dimension_id)
}

// building_footprint
#[spacetimedb::index(name = "position_idx")]
pub fn position_idx(footprint: &BuildingFootprint) -> (i32, i32, u32) {
    (footprint.hex_x, footprint.hex_z, footprint.dimension_id)
}

#[spacetimedb::index(name = "building_idx")]
pub fn building_idx(footprint: &BuildingFootprint) -> u64 {
    footprint.building_entity_id
}
```

---

## 11. 구현 체크리스트

### Phase 1: 코어 데이터 모델
- [ ] BuildingDef 정적 데이터 정의
- [ ] ProjectSiteState 테이블
- [ ] BuildingState 테이블 확장
- [ ] BuildingFootprint 테이블
- [ ] ClaimState 테이블 확장

### Phase 2: 배치 시스템
- [ ] Hex 좌표 회전/변환 유틸리티
- [ ] Footprint 생성/검증
- [ ] 배치 검증 (지형/충돌/권한)
- [ ] 배치 미리보기 API

### Phase 3: 건설 시스템
- [ ] 프로젝트 사이트 생성 리듀서
- [ ] 자재 투입 리듀서
- [ ] 건설 진행 리듀서
- [ ] 완공 처리 및 보상

### Phase 4: 생애주기 관리
- [ ] 건축물 이동 리듀서
- [ ] 철거/반환 리듀서
- [ ] 프로젝트 취소
- [ ] 내구도/수리 시스템

### Phase 5: 클레임 시스템
- [ ] 클레임 토템 배치
- [ ] 클레임 확장/축소
- [ ] 클레임 권한 관리
- [ ] 타일 연결성 검증

### Phase 6: 유지/감가
- [ ] 감가 에이전트 구현
- [ ] 공급 소비 로직
- [ ] 파괴 처리
- [ ] 수리 리듀서

### Phase 7: 클라이언트 동기화
- [ ] 청크 기반 스트리밍
- [ ] 건설 진행 동기화
- [ ] 권한 변화 전파
- [ ] 배치 미리보기

---

## 12. 참고 자료

### BitCraft 문서 참고
- `16-building-and-claim-system.md` - 건축/클레임 시스템
- `22-building-construction.md` - 건설 메커니즘
- `27-permission-and-access-control.md` - 권한 시스템
- `5-hex-grid-coordinate-system.md` - 헥스 좌표계

### BitCraftServer 구현 참고
- `project_site_place.rs` - 배치 검증 알고리즘
- `project_site_advance_project.rs` - 건설 진행
- `building_move.rs` - 건축물 이동
- `building_deconstruct.rs` - 철거 처리
- `project_site_state.rs` - 검증 로직
- `building_helpers.rs` - 생성/삭제 헬퍼
- `claim_helper.rs` - 클레임 관리
- `footprint_helpers.rs` - Footprint 생성

### Stitch 설계 참고
- `DESIGN/DETAIL/world-generation-system.md` - 헥스 좌표/청크
- `DESIGN/05-data-model-tables/building_state.md` - 기존 테이블
- `DESIGN/05-data-model-tables/claim_state.md` - 클레임 테이블
- `DESIGN/05-data-model-tables/permission_state.md` - 권한 테이블

---

## 13. 용어 정의

| 용어 | 설명 |
|------|------|
| **Project Site** | 건설 중인 임시 건축물 (Ghost)
| **Footprint** | 건축물이 차지하는 타일 영역
| **Hitbox** | 물리적 충돌이 있는 타일
| **Walkable** | 캐릭터가 이동 가능한 타일
| **Perimeter** | 배치 금지 영역 (간섭 방지)
| **Claim** | 플레이어/길드가 소유한 영토
| **Claim Totem** | 클레임의 중심이 되는 건축물
| **Supply** | 클레임 내 건축물 유지에 필요한 자원
| **Decay** | 유지비 부족 시 내구도 감소
