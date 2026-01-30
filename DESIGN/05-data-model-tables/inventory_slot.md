# inventory_slot

- Access: private/RLS
- Primary Key: (container_id, slot_index)

## RLS 규칙
- 기본: 소유자만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: container_id, slot_index, item_instance_id
- AdminView: container_id, slot_index, item_instance_id

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = inventory_slot)]
pub struct InventorySlot {
  #[primary_key]
  pub container_id: u64,
  #[primary_key]
  pub slot_index: u32,
  pub item_instance_id: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW inventory_slot_selfview AS
SELECT container_id, slot_index, item_instance_id
FROM inventory_slot
WHERE container_id IN (SELECT container_id FROM inventory_container WHERE owner_entity_id = :viewer_entity_id);

-- AdminView
CREATE VIEW inventory_slot_adminview AS
SELECT container_id, slot_index, item_instance_id
FROM inventory_slot
WHERE :is_admin = true;
```




## 비고
- 직접 거래 시 슬롯 잠금 후 요약만 공유.
