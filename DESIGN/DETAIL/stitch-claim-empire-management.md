# Stitch 클레임/엠파이어 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: DESIGN/DETAIL - 상세 구현 설계  
> **참고**: BitCraftPublicDoc 및 BitCraftServer 구현 패턴은 영감용 참고  
> **범위**: 클레임 타일, 멤버/권한, 엠파이어/시즈

---

## 1. 시스템 개요

- **클레임**: 타일 단위 소유/권한/공급
- **엠파이어**: 다수 클레임의 연합과 전쟁/노드 관리

---

## 2. 테이블 설계 (요약)

### 2.1 claim_state 확장
```rust
#[spacetimedb::table(name = claim_state, public)]
pub struct ClaimState {
  #[primary_key]
  pub claim_id: u64,
  pub owner_player_entity_id: u64,
  pub owner_building_entity_id: u64,
  pub region_id: u64,
  pub name: String,
}
```

### 2.2 claim_tile_state / claim_member_state
```rust
#[spacetimedb::table(name = claim_tile_state, public)]
pub struct ClaimTileState {
  #[primary_key]
  pub entity_id: u64,
  pub claim_id: u64,
  pub x: i32,
  pub z: i32,
  pub dimension: u16,
}

#[spacetimedb::table(name = claim_member_state, public)]
pub struct ClaimMemberState {
  #[primary_key]
  pub entity_id: u64,
  pub claim_id: u64,
  pub player_entity_id: u64,
  pub inventory_permission: bool,
  pub build_permission: bool,
  pub officer_permission: bool,
  pub co_owner_permission: bool,
}
```

### 2.3 claim_local_state / claim_tech_state
```rust
#[spacetimedb::table(name = claim_local_state)]
pub struct ClaimLocalState {
  #[primary_key]
  pub entity_id: u64, // claim_id
  pub supplies: i32,
  pub num_tiles: u32,
  pub num_tile_neighbors: u32,
  pub treasury: u32,
}

#[spacetimedb::table(name = claim_tech_state, public)]
pub struct ClaimTechState {
  #[primary_key]
  pub entity_id: u64,
  pub max_tiles: i32,
  pub tech_level: i32,
}
```

### 2.4 empire_state / empire_rank / empire_node
```rust
#[spacetimedb::table(name = empire_state, public)]
pub struct EmpireState {
  #[primary_key]
  pub entity_id: u64,
  pub capital_building_entity_id: u64,
  pub name: String,
  pub shard_treasury: u32,
  pub nobility_threshold: i32,
  pub num_claims: i32,
}

#[spacetimedb::table(name = empire_rank_state, public)]
pub struct EmpireRankState {
  #[primary_key]
  pub entity_id: u64,
  pub empire_entity_id: u64,
  pub rank: u8,
  pub title: String,
  pub permissions: Vec<bool>,
}

#[spacetimedb::table(name = empire_node_state, public)]
pub struct EmpireNodeState {
  #[primary_key]
  pub entity_id: u64,
  pub empire_entity_id: u64,
  pub chunk_index: u64,
  pub energy: i32,
  pub active: bool,
  pub upkeep: i32,
}
```

---

## 3. 클레임 확장 규칙

### 3.1 인접 타일 규칙
- 신규 타일은 기존 클레임과 인접해야 함.
- 안전지대(초기 바이옴) 근처는 금지.

### 3.2 최소 거리 규칙
- 다른 클레임과 최소 거리 유지.

### 3.3 형태 안정성
- 단순 레이캐스트 기반으로 **볼록성 유지**.

---

## 4. 클레임 소유권 이전

- 공급량이 많을수록 소유권 이전 시간 증가.
- 권한 레벨에 따라 소요 시간이 다름.

---

## 5. 엠파이어/시즈

- 엠파이어는 노드(워치타워) 기반으로 영향력 확장.
- 시즈 시작 시 범위/거리 검증 후 `empire_node_siege_state` 생성.
- 공성 물자는 화폐/카고 소비로 누적.

---

## 6. 권한 시스템

- 클레임 권한: Owner/CoOwner/Officer/Member
- 엠파이어 권한: 랭크별 권한 비트셋
- `permission_state`와 조합하여 건물/타일 접근 통제

---

## 7. 구독 설계

- `claim_tile_state`는 지역별 범위 구독
- `empire_state`/`node_state`는 맵 UI용 요약 구독

---

## 8. 에지 케이스

- 공급 부족 시 감가/방어력 감소
- 타 지역 간 엠파이어 데이터는 shared table로 복제

---

## 9. 관련 문서

- DESIGN/05-data-model-tables/claim_state.md
- DESIGN/05-data-model-tables/permission_state.md
