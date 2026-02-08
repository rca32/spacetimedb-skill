# player_inventory_slot_view

- Access: public
- Primary Key: slot_key (`{container_id}:{slot_index}`)

## RLS 규칙
- 본 테이블은 `inventory_slot` private 원본에서 서버가 동기화하는 projection이다.
- 클라이언트는 원본 대신 본 view만 구독한다.

## 스키마 (서버 구현 기준)
```rust
#[spacetimedb::table(name = player_inventory_slot_view, public)]
pub struct PlayerInventorySlotView {
  #[primary_key]
  pub slot_key: String,
  pub owner_identity: Identity,
  pub container_id: u64,
  pub slot_index: u32,
  pub item_instance_id: u64,
  pub locked: bool,
  pub item_type: u8,
  pub volume: i32,
}
```

## 비고
- 동기화 시점: `inventory_bootstrap`, `item_stack_move`.
