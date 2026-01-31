# Stitch 인벤토리/아이템 스택 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: DESIGN/DETAIL - 상세 구현 설계  
> **참고**: BitCraftPublicDoc 및 BitCraftServer 구현 패턴은 영감용 참고  
> **범위**: 아이템 스택, 포켓(슬롯), 인벤토리 이동/드랍/획득, 아이템 리스트, 발견(Discovery)

---

## 1. 목표
- 아이템/카고 타입을 분리하고 포켓 용량 기반으로 수용량을 제어한다.
- 거래/제작/전투에서 사용 가능한 **잠금 가능한 포켓**을 제공한다.
- 확률 테이블(Item List)과 자동 수집(collectible/knowledge)을 지원한다.

---

## 2. 핵심 개념

### 2.1 ItemStack
- 동일 아이템을 묶는 최소 단위.
- `item_type = Item | Cargo`를 명시.
- 내구도는 `Item`에만 적용. `Cargo`는 내구도 없음.

### 2.2 Pocket(Inventory Slot)
- 슬롯마다 **볼륨**이 있고, 현재 아이템의 `volume * quantity`로 사용량 계산.
- `locked` 플래그로 거래/제작 중 변경을 막는다.

### 2.3 Inventory Container
- `inventory_index`로 역할을 분리(0=가방,1=툴벨트,2=월렛 등).
- `cargo_index`로 Item/Cargo 슬롯 경계를 정의.

---

## 3. 테이블 설계

### 3.1 inventory_container (변경)
```rust
#[spacetimedb::table(name = inventory_container)]
pub struct InventoryContainer {
  #[primary_key]
  pub container_id: u64,
  pub owner_entity_id: u64,
  pub inventory_index: i32,    // 0=main, 1=toolbelt, 2=wallet
  pub cargo_index: i32,        // cargo 시작 슬롯
  pub slot_count: i32,
  pub item_pocket_volume: i32,
  pub cargo_pocket_volume: i32,
  pub player_owner_entity_id: u64, // 플레이어 소유 연결(건물/엔티티 겸용)
}
```

### 3.2 inventory_slot (변경)
```rust
#[spacetimedb::table(name = inventory_slot)]
pub struct InventorySlot {
  #[primary_key]
  pub container_id: u64,
  #[primary_key]
  pub slot_index: u32,
  pub item_instance_id: u64,
  pub volume: i32,
  pub locked: bool,
  pub item_type: u8, // 0=Item, 1=Cargo
}
```

### 3.3 item_instance / item_stack (변경)
```rust
#[spacetimedb::table(name = item_instance)]
pub struct ItemInstance {
  #[primary_key]
  pub item_instance_id: u64,
  pub item_def_id: u64,
  pub item_type: u8,
  pub durability: Option<i32>,
  pub bound: bool,
}

#[spacetimedb::table(name = item_stack)]
pub struct ItemStackRow {
  #[primary_key]
  pub item_instance_id: u64,
  pub quantity: i32,
}
```

### 3.4 item_def (변경)
```rust
#[spacetimedb::table(name = item_def, public)]
pub struct ItemDef {
  #[primary_key]
  pub item_def_id: u64,
  pub item_type: u8,           // 0=Item, 1=Cargo
  pub category: u8,
  pub rarity: u8,
  pub max_stack: u32,
  pub volume: i32,
  pub item_list_id: u64,
  pub auto_collect: bool,
  pub convert_on_zero_durability: u64,
}
```

### 3.5 item_list_def (추가)
```rust
#[spacetimedb::table(name = item_list_def, public)]
pub struct ItemListDef {
  #[primary_key]
  pub item_list_id: u64,
  pub entries: Vec<ItemListEntry>,
}

#[spacetimedb::type]
pub struct ItemListEntry {
  pub probability: f32,
  pub stacks: Vec<InputItemStack>,
}
```

---

## 4. 핵심 알고리즘

### 4.1 포켓 수용량 계산
- `available = pocket.volume - (item.volume * quantity)`
- `can_fit_quantity = available / item.volume`, volume<=0이면 무제한.

### 4.2 add_partial (스택 병합 우선)
1. 동일 `item_id + item_type + durability`의 포켓을 먼저 채움.
2. 남은 수량은 빈 포켓에 삽입.
3. 모든 수량이 들어가면 성공, 남으면 실패/오버플로 처리.

### 4.3 Item List 롤링
- 확률 합을 계산하고 `0..sum` 난수를 한 번 뽑아 구간 선택.
- 선택된 엔트리의 스택이 `item_list_id`를 참조하면 재귀 확장.

### 4.4 자동 수집/발견
- `auto_collect=true`인 아이템은 바로 `vault/knowledge`로 이동.
- `Discovery`는 획득 시점에만 업데이트, 커밋은 액션 종료 시 1회.

### 4.5 내구도 0 변환
- `convert_on_zero_durability=0`이면 파괴.
- 값이 있으면 해당 아이템으로 변환 후 인벤토리에 재삽입.

---

## 5. 리듀서/핸들러 설계

### 5.1 item_stack_move
- 접근 가능한 인벤토리인지 권한 검증.
- 이동 대상 포켓 타입(item/cargo) 매칭.
- `add_partial` 후 실패 수량은 원위치 유지.

### 5.2 item_pick_up
- 드랍 인벤토리에서 스택 추출.
- 플레이어 인벤토리 및 근처 저장소로 분배(거리 기반 우선순위).

### 5.3 item_drop
- 도구/장비 슬롯 분리 처리.
- 드랍 위치는 충돌/높이/권한 검증 후 확정.

### 5.4 inventory_lock/unlock
- 거래 세션/제작/경매 등록 시 해당 포켓 잠금.
- 세션 종료 시 일괄 해제.

---

## 6. 접근 제어

### 6.1 인벤토리 접근 검증
- 플레이어 소유 인벤토리: 소유자만 접근.
- 건물/배치물 인벤토리: 거리 + 권한 + 카테고리 검증.
- 드랍/루트 인벤토리: 타일 권한 + 사용 권한 체크.

---

## 7. 구독 설계

- 기본: 자기 인벤토리만 구독.
- 상호작용 시: 대상 인벤토리의 요약(슬롯/아이템 id/수량)만 단기 구독.
- 거래 중: `escrow` 요약 테이블만 공유.

---

## 8. 에지 케이스

- 포켓 잠금 중 중복 이동 요청 차단.
- 오버플로는 `dropped_inventory` 생성.
- 아이템 리스트 확장 시 인벤토리 부족하면 초과분 드랍.
- 내구도 변환 후 적재 실패 시 드랍 처리.

---

## 9. 메트릭/로그

- `inventory_overflow_count`
- `auto_collect_count`
- `durability_zero_converted_count`
- `item_list_rolls_total`

---

## 10. 관련 문서

- DESIGN/05-data-model-tables/inventory_container.md
- DESIGN/05-data-model-tables/inventory_slot.md
- DESIGN/05-data-model-tables/item_instance.md
- DESIGN/05-data-model-tables/item_stack.md
