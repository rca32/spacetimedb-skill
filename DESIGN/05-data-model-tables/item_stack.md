# item_stack

- Access: private/RLS
- Primary Key: item_instance_id

## RLS 규칙
- 기본: 소유자만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: item_instance_id, quantity
- AdminView: item_instance_id, quantity

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = item_stack)]
pub struct ItemStack {
  #[primary_key]
  pub item_instance_id: u64,
  pub quantity: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW item_stack_selfview AS
SELECT item_instance_id, quantity
FROM item_stack
WHERE item_instance_id IN (SELECT item_instance_id FROM inventory_slot WHERE container_id IN (SELECT container_id FROM inventory_container WHERE owner_entity_id = :viewer_entity_id));

-- AdminView
CREATE VIEW item_stack_adminview AS
SELECT item_instance_id, quantity
FROM item_stack
WHERE :is_admin = true;
```




## 비고
- UI는 요약 필드만 노출.
