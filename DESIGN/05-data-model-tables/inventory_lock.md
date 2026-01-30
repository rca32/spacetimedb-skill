# inventory_lock

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
- SelfView: container_id, lock_reason, expires_at
- AdminView: container_id, lock_reason, expires_at

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = inventory_lock)]
pub struct InventoryLock {
  #[primary_key]
  pub container_id: u64,
  pub lock_reason: u8,
  pub expires_at: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW inventory_lock_selfview AS
SELECT container_id, lock_reason, expires_at
FROM inventory_lock
WHERE container_id IN (SELECT container_id FROM inventory_container WHERE owner_entity_id = :viewer_entity_id);

-- AdminView
CREATE VIEW inventory_lock_adminview AS
SELECT container_id, lock_reason, expires_at
FROM inventory_lock
WHERE :is_admin = true;
```




## 비고
- 거래/제작 중 잠금 상태 기록.
