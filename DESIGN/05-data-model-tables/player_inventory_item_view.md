# player_inventory_item_view

- Access: public
- Primary Key: item_instance_id

## RLS 규칙
- 본 테이블은 `inventory_slot + item_instance + item_stack` private 원본 결합 결과를 서버가 동기화하는 projection이다.
- 클라이언트는 원본 조인 대신 본 view만 구독한다.

## 스키마 (서버 구현 기준)
```rust
#[spacetimedb::table(name = player_inventory_item_view, public)]
pub struct PlayerInventoryItemView {
  #[primary_key]
  pub item_instance_id: u64,
  pub owner_identity: Identity,
  pub container_id: u64,
  pub slot_index: u32,
  pub item_def_id: u64,
  pub quantity: u32,
  pub durability: i32,
  pub bound: bool,
}
```

## 비고
- 동기화 시점: `inventory_bootstrap`, `item_stack_move`.
