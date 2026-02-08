# player_inventory_container_view

- Access: public
- Primary Key: view_key (`{owner_identity}:{container_id}`)

## RLS 규칙
- 본 테이블은 `inventory_container` private 원본에서 서버가 동기화하는 projection이다.
- 클라이언트는 원본 대신 본 view만 구독한다.

## 스키마 (서버 구현 기준)
```rust
#[spacetimedb::table(name = player_inventory_container_view, public)]
pub struct PlayerInventoryContainerView {
  #[primary_key]
  pub view_key: String,
  pub owner_identity: Identity,
  pub container_id: u64,
  pub slot_count: u32,
  pub item_pocket_volume: i32,
  pub cargo_pocket_volume: i32,
}
```

## 비고
- 동기화 시점: `inventory_bootstrap`, `item_stack_move`.
