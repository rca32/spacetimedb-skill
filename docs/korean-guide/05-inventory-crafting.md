# SpacetimeDB 한국어 개발 가이드 - 05. 인벤토리 및 제작 시스템

이 문서에서는 아이템 관리 시스템과 레시피 기반 제작 시스템을 구현합니다.

## 📋 목차

1. [인벤토리 시스템 아키텍처](#1-인벤토리-시스템-아키텍처)
2. [테이블 설계](#2-테이블-설계)
3. [인벤토리 작업](#3-인벤토리-작업)
4. [스택 처리](#4-스택-처리)
5. [제작 시스템](#5-제작-시스템)
6. [레시피 예시](#6-레시피-예시)

---

## 1. 인벤토리 시스템 아키텍처

### 1.1 개념 분리: ItemDef vs ItemInstance

SpacetimeDB 인벤토리 시스템은 **템플릿(ItemDef)**과 **실제 아이템(ItemInstance)**을 분리합니다.

**전통적인 방식 (문제점):**
```rust
struct Item {
    item_id: u64,
    name: String,
    description: String,
    durability: u32,
    owner: Identity,
}
// 문제: 같은 아이템 100개 = 100개의 name, description 중복 저장
```

**SpacetimeDB 방식 (최적화):**
```rust
// ItemDef: 템플릿 (1개만 저장)
struct ItemDef {
    item_def_id: u64,
    name: String,
    description: String,
    max_stack: u32,
}

// ItemInstance: 실제 아이템 (가벼움)
struct ItemInstance {
    instance_id: u64,
    item_def_id: u64,  // ItemDef 참조
    durability: u32,
    owner: Identity,
}
```

### 1.2 인벤토리 컨테이너 모델

```
┌─────────────────────────────────────┐
│      InventoryContainer             │
│  (플레이어의 인벤토리)               │
│  container_id: 12345                │
│  owner_entity_id: 1001              │
│  max_slots: 20                      │
└─────────────────────────────────────┘
           │
           │ contains
           ▼
┌─────────────────────────────────────┐
│  InventorySlot 1: instance_id=501  │
│  InventorySlot 2: instance_id=502  │
│  InventorySlot 3: empty            │
│  ...                               │
│  InventorySlot 20: empty           │
└─────────────────────────────────────┘
```

---

## 2. 테이블 설계

### 2.1 ItemDef (템플릿) - Public

```rust
#[table(name = "item_def", public)]
pub struct ItemDef {
    #[primary_key]
    #[auto_inc]
    pub item_def_id: u64,
    pub name: String,
    pub description: String,
    pub max_stack: u32,      // 최대 스택 수 (1=스택 불가)
    pub weight: u32,         // 무게
    pub value: u32,          // 가치
    pub icon: String,        // 아이콘 경로
    pub is_craftable: bool,  // 제작 가능 여부
}
```

**설명:**
- `public`: 모든 클라이언트가 아이템 템플릿을 볼 수 있음
- `max_stack`: 1 = 스택 불가 (무기, 장비), 99 = 소모품

### 2.2 ItemInstance (실제 아이템) - Private

```rust
#[table(name = "item_instance")]
pub struct ItemInstance {
    #[primary_key]
    #[auto_inc]
    pub instance_id: u64,
    pub item_def_id: u64,
    pub stack_count: u32,     // 현재 스택 수
    pub durability: Option<u32>,  // 내구도 (장비용)
    pub custom_name: Option<String>,  // 커스텀 이름
}
```

### 2.3 InventoryContainer (인벤토리) - Private

```rust
#[table(name = "inventory_container")]
pub struct InventoryContainer {
    #[primary_key]
    #[auto_inc]
    pub container_id: u64,
    pub owner_entity_id: u64,  // PlayerState.entity_id
    pub max_slots: u32,       // 최대 슬롯 수 (기본 20)
}
```

### 2.4 InventorySlot (슬롯) - Private

```rust
#[table(name = "inventory_slot")]
pub struct InventorySlot {
    #[primary_key]
    pub container_id: u64,
    #[primary_key]
    pub slot_index: u32,      // 0 ~ max_slots-1
    pub instance_id: Option<u64>,  // None = 빈 슬롯
}
```

**복합 Primary Key:**
- `(container_id, slot_index)`로 고유 식별
- 같은 슬롯 인덱스라도 다른 컨테이너면 다른 슬롯

### 2.5 WorldItem (바닥에 떨어진 아이템) - Public

```rust
#[table(name = "world_item", public)]
pub struct WorldItem {
    #[primary_key]
    #[auto_inc]
    pub world_item_id: u64,
    pub instance_id: u64,
    pub hex_q: i32,
    pub hex_r: i32,
    pub dropped_at: Timestamp,
    pub dropped_by: Option<Identity>,
}
```

---

## 3. 인벤토리 작업

### 3.1 spawn_player에서 인벤토리 생성

```rust
#[reducer]
pub fn spawn_player(ctx: &ReducerContext, region_id: u64) {
    // ... 기존 플레이어 생성 코드 ...
    
    // 인벤토리 컨테이너 생성
    let container_id = ctx.random();
    ctx.db.inventory_container().insert(InventoryContainer {
        container_id,
        owner_entity_id: entity_id,
        max_slots: 20,
    });
    
    // 20개의 빈 슬롯 생성
    for slot_index in 0..20 {
        ctx.db.inventory_slot().insert(InventorySlot {
            container_id,
            slot_index,
            instance_id: None,  // 빈 슬롯
        });
    }
    
    log::info!("Created inventory with 20 slots for entity {}", entity_id);
}
```

### 3.2 pickup_item - 아이템 줍기

```rust
#[reducer]
pub fn pickup_item(ctx: &ReducerContext, world_item_id: u64) {
    let identity = ctx.sender;
    
    // 1. 플레이어 찾기
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Pickup failed: Player not found");
        return;
    };
    
    // 2. 바닥 아이템 찾기
    let Some(world_item) = ctx.db.world_item().world_item_id().find(&world_item_id) else {
        log::error!("Pickup failed: World item {} not found", world_item_id);
        return;
    };
    
    // 3. 거리 검사 (인접한 헥스만)
    if !is_adjacent_hex(player.hex_q, player.hex_r, world_item.hex_q, world_item.hex_r) {
        log::error!("Pickup failed: Too far away");
        return;
    }
    
    // 4. 인벤토리 컨테이너 찾기
    let Some(container) = ctx.db.inventory_container()
        .owner_entity_id()
        .filter(player.entity_id)
        .next() else {
        log::error!("Pickup failed: Inventory not found");
        return;
    };
    
    // 5. 아이템 인스턴스 정보 가져오기
    let Some(instance) = ctx.db.item_instance()
        .instance_id()
        .find(&world_item.instance_id) else {
        log::error!("Pickup failed: Item instance not found");
        return;
    };
    
    let item_def = ctx.db.item_def()
        .item_def_id()
        .find(&instance.item_def_id)
        .expect("ItemDef not found");
    
    // 6. 빈 슬롯 또는 스택 가능한 슬롯 찾기
    let target_slot = find_slot_for_item(
        ctx, 
        container.container_id, 
        world_item.instance_id,
        item_def.max_stack,
        instance.stack_count
    );
    
    let Some((slot_index, target_instance_id)) = target_slot else {
        log::error!("Pickup failed: Inventory full");
        return;
    };
    
    // 7. 스택 처리
    if let Some(target_instance_id) = target_instance_id {
        // 기존 인스턴스에 스택
        merge_item_stack(ctx, target_instance_id, world_item.instance_id);
    } else {
        // 새 슬롯에 배치
        ctx.db.inventory_slot().update(InventorySlot {
            container_id: container.container_id,
            slot_index,
            instance_id: Some(world_item.instance_id),
        });
    }
    
    // 8. 월드에서 아이템 삭제
    ctx.db.world_item().world_item_id().delete(&world_item_id);
    
    log::info!("Player {} picked up item {}", player.entity_id, item_def.name);
}
```

### 3.3 drop_item - 아이템 버리기

```rust
#[reducer]
pub fn drop_item(ctx: &ReducerContext, slot_index: u32) {
    let identity = ctx.sender;
    
    // 1. 플레이어 및 인벤토리 찾기
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        return;
    };
    
    let Some(container) = ctx.db.inventory_container()
        .owner_entity_id()
        .filter(player.entity_id)
        .next() else {
        return;
    };
    
    // 2. 슬롯 확인
    let Some(slot) = ctx.db.inventory_slot()
        .container_id()
        .filter(container.container_id)
        .find(|s| s.slot_index == slot_index) else {
        log::error!("Drop failed: Invalid slot {}", slot_index);
        return;
    };
    
    let Some(instance_id) = slot.instance_id else {
        log::error!("Drop failed: Slot {} is empty", slot_index);
        return;
    };
    
    // 3. 월드에 아이템 생성
    ctx.db.world_item().insert(WorldItem {
        world_item_id: ctx.random(),
        instance_id,
        hex_q: player.hex_q,
        hex_r: player.hex_r,
        dropped_at: ctx.timestamp,
        dropped_by: Some(identity),
    });
    
    // 4. 인벤토리에서 제거
    ctx.db.inventory_slot().update(InventorySlot {
        container_id: container.container_id,
        slot_index,
        instance_id: None,
    });
    
    log::info!("Player {} dropped item at ({}, {})", 
        player.entity_id, player.hex_q, player.hex_r);
}
```

### 3.4 move_item - 슬롯 간 이동

```rust
#[reducer]
pub fn move_item(ctx: &ReducerContext, from_slot: u32, to_slot: u32) {
    let identity = ctx.sender;
    
    // 1. 플레이어 및 인벤토리 찾기
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        return;
    };
    
    let Some(container) = ctx.db.inventory_container()
        .owner_entity_id()
        .filter(player.entity_id)
        .next() else {
        return;
    };
    
    // 2. from 슬롯 확인
    let Some(from) = ctx.db.inventory_slot()
        .container_id()
        .filter(container.container_id)
        .find(|s| s.slot_index == from_slot) else {
        log::error!("Move failed: Invalid from_slot {}", from_slot);
        return;
    };
    
    let Some(instance_id) = from.instance_id else {
        log::error!("Move failed: from_slot {} is empty", from_slot);
        return;
    };
    
    // 3. to 슬롯 확인
    let Some(to) = ctx.db.inventory_slot()
        .container_id()
        .filter(container.container_id)
        .find(|s| s.slot_index == to_slot) else {
        log::error!("Move failed: Invalid to_slot {}", to_slot);
        return;
    };
    
    // 4. to 슬롯이 비어있으면 단순 이동
    if to.instance_id.is_none() {
        // from 비우기
        ctx.db.inventory_slot().update(InventorySlot {
            container_id: container.container_id,
            slot_index: from_slot,
            instance_id: None,
        });
        
        // to 채우기
        ctx.db.inventory_slot().update(InventorySlot {
            container_id: container.container_id,
            slot_index: to_slot,
            instance_id: Some(instance_id),
        });
        
        log::info!("Moved item from slot {} to {}", from_slot, to_slot);
        return;
    }
    
    // 5. to 슬롯이 있으면 스택 가능 여부 확인
    let from_instance = ctx.db.item_instance().instance_id().find(&instance_id).unwrap();
    let to_instance_id = to.instance_id.unwrap();
    let to_instance = ctx.db.item_instance().instance_id().find(&to_instance_id).unwrap();
    
    if from_instance.item_def_id == to_instance.item_def_id {
        // 같은 아이템이면 스택 시도
        let item_def = ctx.db.item_def().item_def_id().find(&from_instance.item_def_id).unwrap();
        let total_count = from_instance.stack_count + to_instance.stack_count;
        
        if total_count <= item_def.max_stack {
            // 완전히 합침
            ctx.db.item_instance().instance_id().update(ItemInstance {
                instance_id: to_instance_id,
                stack_count: total_count,
                ..to_instance
            });
            
            // from 인스턴스 삭제
            ctx.db.item_instance().instance_id().delete(&instance_id);
            ctx.db.inventory_slot().update(InventorySlot {
                container_id: container.container_id,
                slot_index: from_slot,
                instance_id: None,
            });
            
            log::info!("Stacked items: {} + {} = {}", 
                from_instance.stack_count, to_instance.stack_count, total_count);
        } else {
            // 부분 스택
            let remaining = total_count - item_def.max_stack;
            
            ctx.db.item_instance().instance_id().update(ItemInstance {
                instance_id: to_instance_id,
                stack_count: item_def.max_stack,
                ..to_instance
            });
            
            ctx.db.item_instance().instance_id().update(ItemInstance {
                instance_id,
                stack_count: remaining,
                ..from_instance
            });
            
            log::info!("Partial stack: target full ({}), {} remaining", 
                item_def.max_stack, remaining);
        }
    } else {
        // 다른 아이템이면 교환
        ctx.db.inventory_slot().update(InventorySlot {
            container_id: container.container_id,
            slot_index: from_slot,
            instance_id: to.instance_id,
        });
        
        ctx.db.inventory_slot().update(InventorySlot {
            container_id: container.container_id,
            slot_index: to_slot,
            instance_id: Some(instance_id),
        });
        
        log::info!("Swapped items between slots {} and {}", from_slot, to_slot);
    }
}
```

---

## 4. 스택 처리

### 4.1 스택 찾기 알고리즘

```rust
fn find_slot_for_item(
    ctx: &ReducerContext,
    container_id: u64,
    instance_id: u64,
    max_stack: u32,
    stack_count: u32,
) -> Option<(u32, Option<u64>)> {
    let instance = ctx.db.item_instance().instance_id().find(&instance_id)?;
    
    // 1. 먼저 스택 가능한 기존 슬롯 찾기
    if max_stack > 1 {
        for slot in ctx.db.inventory_slot().container_id().filter(container_id) {
            if let Some(existing_instance_id) = slot.instance_id {
                let existing = ctx.db.item_instance().instance_id().find(&existing_instance_id)?;
                
                // 같은 아이템 종류 && 최대 스택 미만
                if existing.item_def_id == instance.item_def_id 
                   && existing.stack_count < max_stack {
                    return Some((slot.slot_index, Some(existing_instance_id)));
                }
            }
        }
    }
    
    // 2. 빈 슬롯 찾기
    for slot in ctx.db.inventory_slot().container_id().filter(container_id) {
        if slot.instance_id.is_none() {
            return Some((slot.slot_index, None));
        }
    }
    
    None  // 인벤토리 가득 참
}

fn merge_item_stack(ctx: &ReducerContext, target_id: u64, source_id: u64) {
    let target = ctx.db.item_instance().instance_id().find(&target_id).unwrap();
    let source = ctx.db.item_instance().instance_id().find(&source_id).unwrap();
    let item_def = ctx.db.item_def().item_def_id().find(&target.item_def_id).unwrap();
    
    let total = target.stack_count + source.stack_count;
    
    if total <= item_def.max_stack {
        // 완전히 합침
        ctx.db.item_instance().instance_id().update(ItemInstance {
            instance_id: target_id,
            stack_count: total,
            ..target
        });
        
        // 소스 삭제
        ctx.db.item_instance().instance_id().delete(&source_id);
    } else {
        // 부분 합침
        let overflow = total - item_def.max_stack;
        
        ctx.db.item_instance().instance_id().update(ItemInstance {
            instance_id: target_id,
            stack_count: item_def.max_stack,
            ..target
        });
        
        ctx.db.item_instance().instance_id().update(ItemInstance {
            instance_id: source_id,
            stack_count: overflow,
            ..source
        });
    }
}
```

---

## 5. 제작 시스템

### 5.1 Recipe (레시피) 테이블 - Public

```rust
#[table(name = "recipe", public)]
pub struct Recipe {
    #[primary_key]
    #[auto_inc]
    pub recipe_id: u64,
    pub name: String,
    pub output_item_def_id: u64,  // 결과물
    pub output_count: u32,        // 결과물 개수
    pub required_level: u32,      // 필요 레벨
}
```

### 5.2 RecipeIngredient (재료) 테이블 - Public

```rust
#[table(name = "recipe_ingredient", public)]
pub struct RecipeIngredient {
    #[primary_key]
    pub recipe_id: u64,
    #[primary_key]
    pub ingredient_item_def_id: u64,
    pub required_count: u32,      // 필요 개수
}
```

### 5.3 craft_item 리듀서

```rust
#[reducer]
pub fn craft_item(ctx: &ReducerContext, recipe_id: u64) {
    let identity = ctx.sender;
    
    // 1. 플레이어 및 인벤토리 찾기
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Craft failed: Player not found");
        return;
    };
    
    let Some(container) = ctx.db.inventory_container()
        .owner_entity_id()
        .filter(player.entity_id)
        .next() else {
        log::error!("Craft failed: Inventory not found");
        return;
    };
    
    // 2. 레시피 확인
    let Some(recipe) = ctx.db.recipe().recipe_id().find(&recipe_id) else {
        log::error!("Craft failed: Recipe {} not found", recipe_id);
        return;
    };
    
    // 3. 레벨 검사
    if player.level < recipe.required_level {
        log::error!("Craft failed: Level {} < required {}", player.level, recipe.required_level);
        return;
    }
    
    // 4. 필요한 재료 수집
    let ingredients: Vec<RecipeIngredient> = ctx.db.recipe_ingredient()
        .recipe_id()
        .filter(recipe_id)
        .collect();
    
    if ingredients.is_empty() {
        log::error!("Craft failed: Recipe {} has no ingredients", recipe_id);
        return;
    }
    
    // 5. 인벤토리에서 재료 찾기 및 소비 계획
    let mut slots_to_update: Vec<(u32, u64, u32)> = Vec::new(); // (slot_index, instance_id, remaining_count)
    
    for ingredient in &ingredients {
        let mut remaining_to_consume = ingredient.required_count;
        
        // 해당 아이템 종류의 모든 스택 찾기
        for slot in ctx.db.inventory_slot().container_id().filter(container.container_id) {
            if remaining_to_consume == 0 {
                break;
            }
            
            if let Some(instance_id) = slot.instance_id {
                let instance = ctx.db.item_instance().instance_id().find(&instance_id).unwrap();
                
                if instance.item_def_id == ingredient.ingredient_item_def_id {
                    let can_consume = instance.stack_count.min(remaining_to_consume);
                    remaining_to_consume -= can_consume;
                    
                    let remaining_in_slot = instance.stack_count - can_consume;
                    slots_to_update.push((slot.slot_index, instance_id, remaining_in_slot));
                }
            }
        }
        
        if remaining_to_consume > 0 {
            log::error!("Craft failed: Insufficient ingredient {}", ingredient.ingredient_item_def_id);
            return;
        }
    }
    
    // 6. 재료 소비 (원자적 작업)
    for (slot_index, instance_id, remaining) in slots_to_update {
        if remaining == 0 {
            // 인스턴스 완전 삭제
            ctx.db.item_instance().instance_id().delete(&instance_id);
            ctx.db.inventory_slot().update(InventorySlot {
                container_id: container.container_id,
                slot_index,
                instance_id: None,
            });
        } else {
            // 스택 수량 감소
            let instance = ctx.db.item_instance().instance_id().find(&instance_id).unwrap();
            ctx.db.item_instance().instance_id().update(ItemInstance {
                instance_id,
                stack_count: remaining,
                ..instance
            });
        }
    }
    
    // 7. 결과물 생성
    let output_instance_id = ctx.random();
    ctx.db.item_instance().insert(ItemInstance {
        instance_id: output_instance_id,
        item_def_id: recipe.output_item_def_id,
        stack_count: recipe.output_count,
        durability: None,
        custom_name: None,
    });
    
    // 8. 결과물을 인벤토리에 추가
    let result = add_item_to_inventory(ctx, container.container_id, output_instance_id);
    if result.is_none() {
        // 인벤토리 가득참 - 결과물은 월드에 드롭
        ctx.db.world_item().insert(WorldItem {
            world_item_id: ctx.random(),
            instance_id: output_instance_id,
            hex_q: player.hex_q,
            hex_r: player.hex_r,
            dropped_at: ctx.timestamp,
            dropped_by: Some(identity),
        });
        log::warn!("Crafted item dropped to world: inventory full");
    }
    
    log::info!("Player {} crafted {} x{}", 
        player.entity_id, recipe.name, recipe.output_count);
}
```

---

## 6. 레시피 예시

### 6.1 초기화 시 레시피 생성

```rust
#[reducer]
pub fn init(ctx: &ReducerContext) {
    // ... NPC 생성 코드 ...
    
    // 아이템 템플릿 생성
    create_item_def(ctx, "Wood", "나무", 99, 1, 10);
    create_item_def(ctx, "Stone", "돌", 99, 2, 5);
    create_item_def(ctx, "Iron", "철", 99, 5, 50);
    create_item_def(ctx, "Wood Axe", "나무 도끼", 1, 100, 100, true);
    create_item_def(ctx, "Stone Axe", "돌 도끼", 1, 200, 200, true);
    
    // 레시피 생성
    create_recipe(ctx, "Wood Axe", 
        vec![(1, 5), (2, 3)],  // Wood 5개, Stone 3개
        4, 1,  // Wood Axe 1개
        1      // 레벨 1 필요
    );
    
    create_recipe(ctx, "Stone Axe",
        vec![(2, 10), (3, 5)],  // Stone 10개, Iron 5개
        5, 1,
        5      // 레벨 5 필요
    );
}

fn create_item_def(
    ctx: &ReducerContext,
    name: &str,
    description: &str,
    max_stack: u32,
    weight: u32,
    value: u32,
    is_craftable: bool,
) -> u64 {
    let item_def_id = ctx.random();
    ctx.db.item_def().insert(ItemDef {
        item_def_id,
        name: name.to_string(),
        description: description.to_string(),
        max_stack,
        weight,
        value,
        icon: format!("/icons/{}.png", name.to_lowercase().replace(" ", "_")),
        is_craftable,
    });
    item_def_id
}

fn create_recipe(
    ctx: &ReducerContext,
    name: &str,
    ingredients: Vec<(u64, u32)>,  // (item_def_id, count)
    output_item_def_id: u64,
    output_count: u32,
    required_level: u32,
) -> u64 {
    let recipe_id = ctx.random();
    
    ctx.db.recipe().insert(Recipe {
        recipe_id,
        name: name.to_string(),
        output_item_def_id,
        output_count,
        required_level,
    });
    
    for (item_def_id, count) in ingredients {
        ctx.db.recipe_ingredient().insert(RecipeIngredient {
            recipe_id,
            ingredient_item_def_id: item_def_id,
            required_count: count,
        });
    }
    
    recipe_id
}
```

### 6.2 레시피 조회 (클라이언트용)

```typescript
// 클라이언트에서 레시피 정보 가져오기
const recipes = conn.db.recipe.iter();

for (const recipe of recipes) {
    const ingredients = conn.db.recipe_ingredient
        .recipe_id()
        .filter(recipe.recipe_id);
    
    console.log(`레시피: ${recipe.name}`);
    console.log(`필요 레벨: ${recipe.required_level}`);
    console.log(`결과물: ${recipe.output_count}개`);
    
    console.log('재료:');
    for (const ing of ingredients) {
        const itemDef = conn.db.item_def.item_def_id.find(ing.ingredient_item_def_id);
        console.log(`  - ${itemDef?.name}: ${ing.required_count}개`);
    }
}
```

---

## 📝 정리

### 인벤토리 시스템 구성

```
ItemDef (템플릿, Public)
    ↓ 참조
ItemInstance (실제 아이템, Private)
    ↓ 포함
InventorySlot (슬롯, Private) ← InventoryContainer (컨테이너, Private)
```

### 주요 리듀서

| 리듀서 | 기능 |
|--------|------|
| `pickup_item` | 바닥 아이템 줍기 (거리 + 인벤토리 검사) |
| `drop_item` | 아이템 바닥에 버리기 |
| `move_item` | 슬롯 간 이동 (스택/교환 처리) |
| `craft_item` | 레시피 기반 제작 (재료 소비 + 결과물 생성) |

### 스택 처리 규칙

1. 같은 `item_def_id`끼리만 스택 가능
2. `max_stack`을 초과할 수 없음
3. 부분 소비 시 남은 스택은 원래 슬롯에 유지

---

## 👉 다음 단계

이제 **[06. NPC와 클라이언트 연동](./06-npc-client.md)**에서 AI NPC 시스템과 React 클라이언트를 구현해봅시다!

---

*인벤토리 최적화에 대해 더 알고 싶다면 [SpacetimeDB 인덱싱 전략](https://spacetimedb.com/docs/indexing)을 참고하세요.*
