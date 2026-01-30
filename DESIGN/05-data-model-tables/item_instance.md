# item_instance

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
- SelfView: item_instance_id, item_def_id, durability, bound
- AdminView: item_instance_id, item_def_id, durability, bound

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = item_instance)]
pub struct ItemInstance {
  #[primary_key]
  pub item_instance_id: u64,
  pub item_def_id: u64,
  pub durability: u32,
  pub bound: bool,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW item_instance_selfview AS
SELECT item_instance_id, item_def_id, durability, bound
FROM item_instance
WHERE item_instance_id IN (SELECT item_instance_id FROM inventory_slot WHERE container_id IN (SELECT container_id FROM inventory_container WHERE owner_entity_id = :viewer_entity_id));

-- AdminView
CREATE VIEW item_instance_adminview AS
SELECT item_instance_id, item_def_id, durability, bound
FROM item_instance
WHERE :is_admin = true;
```




## 비고
- 거래 상대에게는 item_def_id/qty 요약만.
