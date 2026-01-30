# inventory_container

- Access: private/RLS
- Primary Key: container_id

## RLS 규칙
- 기본: 소유자만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: container_id, owner_entity_id, type
- AdminView: container_id, owner_entity_id, type

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = inventory_container)]
pub struct InventoryContainer {
  #[primary_key]
  pub container_id: u64,
  pub owner_entity_id: u64,
  pub type: u8,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW inventory_container_selfview AS
SELECT container_id, owner_entity_id, type
FROM inventory_container
WHERE owner_entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW inventory_container_adminview AS
SELECT container_id, owner_entity_id, type
FROM inventory_container
WHERE :is_admin = true;
```




## 비고
- 거래 중에는 escrow 뷰로만 공유.
